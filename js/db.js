// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB5iGfkr0hMNEgXjLruxQg-LM1Igu41gBU",
  authDomain: "paradigm-classes.firebaseapp.com",
  projectId: "paradigm-classes",
  storageBucket: "paradigm-classes.firebasestorage.app",
  messagingSenderId: "999886632912",
  appId: "1:999886632912:web:eb991af6f847f20142ebd5",
  measurementId: "G-4G99FH33J4"
};

// Initialize Firebase using global window.firebase from compat imports
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Helper to fetch list from a specific document
async function getList(docId) {
    try {
        const snapshot = await db.collection('appData').doc(docId).get();
        if (snapshot.exists) {
            return snapshot.data().list || [];
        }
        return [];
    } catch (error) {
        console.error(`🔥 Firebase Permission Error getting ${docId}:`, error.message);
        if(docId !== 'admin') {
            alert(`Database Read Error: Firebase is blocking data access. Please check your internet connection or Firestore rules.\n\n${error.message}`);
        }
        throw error; // Stop execution to prevent empty arrays from overwriting existing data
    }
}

// Helper to save list to a specific document
async function setList(docId, list) {
    try {
        await db.collection('appData').doc(docId).set({ list });
    } catch (error) {
        console.error(`🔥 Firebase Permission Error setting ${docId}:`, error.message);
        alert(`Database Write Error: Firebase is blocking data modifications. Please set Firestore Security Rules to 'true'.\n\n${error.message}`);
    }
}

const DB = {
    getStudents: async () => await getList('students'),
    setStudents: async (students) => await setList('students', students),
    
    getAlumni: async () => await getList('alumni'),
    setAlumni: async (alumni) => await setList('alumni', alumni),
    
    getTeachers: async () => await getList('teachers'),
    setTeachers: async (teachers) => await setList('teachers', teachers),
    
    getSalaries: async () => await getList('salaries'),
    setSalaries: async (salaries) => await setList('salaries', salaries),

    getCourses: async () => await getList('courses'),
    setCourses: async (courses) => await setList('courses', courses),
    
    getAdmin: async () => {
        try {
            const snapshot = await db.collection('appData').doc('admin').get();
            if (snapshot.exists) {
                return snapshot.data();
            }
            return { id: "admin", password: "admin123" };
        } catch (e) {
            throw e;
        }
    },
    setAdmin: async (admin) => {
        await db.collection('appData').doc('admin').set(admin);
    },

    getTests: async () => await getList('tests'),
    setTests: async (tests) => await setList('tests', tests),

    formatDate: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    },

    // currentUser remains in localStorage since it's session-based per physical device
    getCurrentUser: () => JSON.parse(localStorage.getItem('pc_currentUser') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('pc_currentUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('pc_currentUser'),

    getAnnouncement: async () => {
        try {
            const snapshot = await db.collection('appData').doc('announcement').get();
            if (snapshot.exists) {
                return snapshot.data() || { text: "", enabled: false };
            }
            return { text: "Welcome to Paradigm Classes! Admissions are now open for the academic session 2026-2027. Enroll today!", enabled: true };
        } catch (e) {
            console.error("Error getting announcement:", e.message);
            return { text: "", enabled: false };
        }
    },
    setAnnouncement: async (announcement) => {
        try {
            await db.collection('appData').doc('announcement').set(announcement);
        } catch (e) {
            console.error("Error setting announcement:", e.message);
            alert("Database Error setting announcement: " + e.message);
        }
    },
    
    initData: async () => {
        try {
            // Only set default admin if the admin doc truly doesn't exist
            const snapshot = await db.collection('appData').doc('admin').get();
            if (!snapshot.exists) {
                await DB.setAdmin({ id: "admin", password: "admin123" });
            }
        } catch (e) {
            console.error("Firebase init check failed:", e.message);
            // Do not seed any dummy data to prevent accidental overwrites
        }
    }
};

// Dynamic Announcement Marquee Injector
async function initAnnouncementBanner() {
    try {
        const ann = await DB.getAnnouncement();
        if (ann && ann.enabled && ann.text && ann.text.trim().length > 0) {
            if (document.querySelector('.pc-marquee-banner')) return;

            const style = document.createElement('style');
            style.textContent = `
                .pc-marquee-banner {
                    background: linear-gradient(90deg, #1e3a8a 0%, #d97706 50%, #1e3a8a 100%);
                    color: white;
                    padding: 0.5rem 0;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    font-size: 0.95rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 9999;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
                    border-bottom: 2px solid #b45309;
                    height: 36px;
                    display: flex;
                    align-items: center;
                }
                .pc-marquee-banner marquee {
                    margin: 0;
                    padding: 0;
                    vertical-align: middle;
                }
                body.has-marquee {
                    padding-top: 36px !important;
                }
                body.has-marquee .navbar {
                    top: 36px !important;
                }
            `;
            document.head.appendChild(style);

            const banner = document.createElement('div');
            banner.className = 'pc-marquee-banner';
            banner.innerHTML = `
                <marquee behavior="scroll" direction="left" scrollamount="6" onmouseover="this.stop()" onmouseout="this.start()">
                    <span style="margin-right: 50px;">📢 ${ann.text}</span>
                </marquee>
            `;

            document.body.prepend(banner);
            document.body.classList.add('has-marquee');
        }
    } catch (e) {
        console.error("Announcement banner failed to load:", e);
    }
}

// Fire initialization payload
DB.initData();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnnouncementBanner);
} else {
    initAnnouncementBanner();
}

