// Accessibility & Anti-Flicker Synchronous Check
(function() {
    const theme = localStorage.getItem('pc_theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        if (document.body) document.body.classList.add('dark-mode');
    }
    const size = parseInt(localStorage.getItem('pc_font_size') || '100');
    if (size !== 100) {
        document.documentElement.style.fontSize = size + '%';
    }
})();

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

    getAttendance: async () => await getList('attendance'),
    setAttendance: async (attendance) => await setList('attendance', attendance),

    getCourses: async () => await getList('courses'),
    setCourses: async (courses) => await setList('courses', courses),
    
    getSlides: async () => await getList('slides'),
    setSlides: async (slides) => await setList('slides', slides),
    
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
                    left: 0;
                    right: 0;
                    z-index: 999; /* Positioned just below navbar z-index of 1000 so dropdowns overlap it */
                    box-shadow: 0 4px 10px rgba(0,0,0,0.12);
                    border-bottom: 2px solid #b45309;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    overflow: hidden;
                    white-space: nowrap;
                }
                
                @keyframes pcMarqueeSmooth {
                    0% { transform: translate3d(0, 0, 0); }
                    100% { transform: translate3d(-100%, 0, 0); }
                }
                
                .pc-marquee-track {
                    display: inline-block;
                    white-space: nowrap;
                    padding-left: 100%;
                    animation: pcMarqueeSmooth 25s linear infinite;
                    will-change: transform;
                }
                
                .pc-marquee-banner:hover .pc-marquee-track {
                    animation-play-state: paused;
                }
                
                body.has-marquee {
                    padding-top: 36px !important; /* Safer body shift down using padding-top */
                }
            `;
            document.head.appendChild(style);

            const banner = document.createElement('div');
            banner.className = 'pc-marquee-banner';
            banner.innerHTML = `
                <div class="pc-marquee-track">📢 ${ann.text}</div>
            `;

            document.body.prepend(banner);
            document.body.classList.add('has-marquee');

            // Dynamic Positioning Adjustment Logic based on real-time navbar height
            function adjustMarqueePosition() {
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    banner.style.top = `${navbar.offsetHeight}px`;
                } else {
                    banner.style.top = '80px'; // Fallback
                }
            }

            // Run alignment instantly and on resize
            adjustMarqueePosition();
            window.addEventListener('resize', adjustMarqueePosition);
            
            // Re-verify after load/render cycles
            setTimeout(adjustMarqueePosition, 100);
            setTimeout(adjustMarqueePosition, 500);
        }
    } catch (e) {
        console.error("Announcement banner failed to load:", e);
    }
}

// Dynamic Auth Navbar sync
async function initNavbarAuth() {
    try {
        const user = DB.getCurrentUser();
        const navCta = document.querySelector('.nav-cta');
        const mobileMenu = document.getElementById('mobileMenu');
        const isDashboardPage = window.location.pathname.includes('-dashboard.html');

        // Helper to log out globally
        window.handleGlobalLogout = (e) => {
            if (e) e.preventDefault();
            DB.logout();
            window.location.href = 'index.html';
        };

        if (user && user.role) {
            // Logged in state
            const dashboardUrl = user.role === 'teacher' ? 'teacher-dashboard.html' : 
                                 (user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html');

            if (navCta && !isDashboardPage) {
                navCta.style.display = 'flex';
                navCta.style.gap = '0.5rem';
                navCta.style.alignItems = 'center';
                
                // Show both Dashboard and Logout buttons
                navCta.innerHTML = `
                    <a class="btn" href="${dashboardUrl}" style="background: #1e40af; color: white; border: none; padding: 0.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 0.375rem; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 38px; box-sizing: border-box;">DASHBOARD</a>
                    <button class="btn" onclick="handleGlobalLogout(event)" style="background: transparent; color: #dc2626; border: 2px solid #dc2626; padding: 0.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 0.375rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; width: 120px; height: 38px; box-sizing: border-box;">LOGOUT</button>
                `;
            }

            if (mobileMenu) {
                // Remove existing CTAs
                const existingCtas = mobileMenu.querySelectorAll('.mobile-cta, .mobile-logout, .mobile-dashboard');
                existingCtas.forEach(el => el.remove());

                if (!isDashboardPage) {
                    const dashboardLink = document.createElement('a');
                    dashboardLink.className = 'mobile-link mobile-dashboard';
                    dashboardLink.href = dashboardUrl;
                    dashboardLink.style.fontWeight = 'bold';
                    dashboardLink.style.color = '#1e40af';
                    dashboardLink.textContent = 'Dashboard';
                    mobileMenu.appendChild(dashboardLink);
                }

                const logoutLink = document.createElement('a');
                logoutLink.className = 'mobile-cta mobile-logout';
                logoutLink.href = '#';
                logoutLink.style.background = '#dc2626';
                logoutLink.style.color = 'white';
                logoutLink.style.marginTop = '0.5rem';
                logoutLink.textContent = 'LOGOUT';
                logoutLink.onclick = handleGlobalLogout;
                mobileMenu.appendChild(logoutLink);
            }
        } else {
            // Logged out state
            if (navCta && !isDashboardPage) {
                navCta.style.display = ''; // reset to stylesheet default
                navCta.innerHTML = `
                    <a class="btn btn-primary" href="login.html">LOGIN</a>
                `;
            }

            if (mobileMenu) {
                const existingCtas = mobileMenu.querySelectorAll('.mobile-cta, .mobile-logout, .mobile-dashboard');
                existingCtas.forEach(el => el.remove());

                const loginCta = document.createElement('a');
                loginCta.className = 'mobile-cta';
                loginCta.href = 'login.html';
                loginCta.textContent = 'LOGIN';
                mobileMenu.appendChild(loginCta);
            }
        }
    } catch (e) {
        console.error("Navbar Auth check failed:", e);
    }
}

// Dynamic Accessibility Widget Setup
function initAccessibilityWidget() {
    try {
        if (document.querySelector('.pc-accessibility-widget')) return;

        // 1. Inject Accessibility Panel CSS Styles
        const style = document.createElement('style');
        style.textContent = `
            .pc-accessibility-widget {
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: rgba(255, 255, 255, 0.85);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(226, 232, 240, 0.8);
                border-radius: 99px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                padding: 6px 12px;
                z-index: 1500;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            body.dark-mode .pc-accessibility-widget {
                background: rgba(30, 41, 59, 0.85);
                border-color: rgba(71, 85, 105, 0.8);
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
            }

            .pc-acc-btn {
                background: transparent;
                border: none;
                color: #1e293b;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }

            body.dark-mode .pc-acc-btn {
                color: #f8fafc;
            }

            .pc-acc-btn:hover {
                background: rgba(30, 58, 138, 0.1);
                transform: scale(1.15);
            }

            body.dark-mode .pc-acc-btn:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .pc-acc-icon {
                width: 18px;
                height: 18px;
                transition: transform 0.3s ease;
                stroke: currentColor;
            }

            .pc-acc-divider {
                width: 1px;
                height: 20px;
                background: #cbd5e1;
                margin: 0 8px;
            }

            body.dark-mode .pc-acc-divider {
                background: #475569;
            }

            .pc-acc-label {
                position: absolute;
                font-size: 0.6rem;
                font-weight: 700;
                bottom: -1px;
            }

            .pc-theme-toggle-btn:hover .pc-acc-icon {
                transform: rotate(20deg);
            }
        `;
        document.head.appendChild(style);

        // 2. Create accessibility widget panel DOM element
        const widget = document.createElement('div');
        widget.className = 'pc-accessibility-widget';
        widget.innerHTML = `
            <button class="pc-acc-btn" onclick="adjustTextSize(-10)" title="Decrease Text Size" style="padding-bottom: 2px;">
                <svg class="pc-acc-icon" fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 13H5" />
                </svg>
                <span class="pc-acc-label" style="bottom: 0px;">A-</span>
            </button>
            
            <button class="pc-acc-btn pc-acc-size-indicator" onclick="resetTextSize()" title="Reset Text Size" style="font-size: 0.8rem; font-weight: 700; min-width: 45px; letter-spacing: -0.02em;">
                100%
            </button>

            <button class="pc-acc-btn" onclick="adjustTextSize(10)" title="Increase Text Size" style="padding-bottom: 2px;">
                <svg class="pc-acc-icon" fill="none" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span class="pc-acc-label" style="bottom: 0px;">A+</span>
            </button>

            <div class="pc-acc-divider"></div>

            <button class="pc-acc-btn pc-theme-toggle-btn" onclick="toggleTheme()" title="Toggle Theme">
                <svg class="pc-acc-icon pc-sun-icon" fill="none" stroke-width="2" viewBox="0 0 24 24" style="display: none;">
                    <circle cx="12" cy="12" r="5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <svg class="pc-acc-icon pc-moon-icon" fill="none" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
            </button>
        `;
        document.body.appendChild(widget);

        // 3. Sync theme & size configuration to widget view
        const theme = localStorage.getItem('pc_theme') || 'light';
        const sunIcons = document.querySelectorAll('.pc-sun-icon');
        const moonIcons = document.querySelectorAll('.pc-moon-icon');
        if (theme === 'dark') {
            sunIcons.forEach(i => i.style.display = 'block');
            moonIcons.forEach(i => i.style.display = 'none');
        } else {
            sunIcons.forEach(i => i.style.display = 'none');
            moonIcons.forEach(i => i.style.display = 'block');
        }

        const size = parseInt(localStorage.getItem('pc_font_size') || '100');
        const indicators = document.querySelectorAll('.pc-acc-size-indicator');
        indicators.forEach(ind => ind.textContent = size + '%');

    } catch (e) {
        console.error("Accessibility widget failed to initialize:", e);
    }
}

// Global window actions for accessibility functions
window.toggleTheme = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('pc_theme', isDark ? 'dark' : 'light');
    
    const sunIcons = document.querySelectorAll('.pc-sun-icon');
    const moonIcons = document.querySelectorAll('.pc-moon-icon');
    if (isDark) {
        sunIcons.forEach(i => i.style.display = 'block');
        moonIcons.forEach(i => i.style.display = 'none');
    } else {
        sunIcons.forEach(i => i.style.display = 'none');
        moonIcons.forEach(i => i.style.display = 'block');
    }
};

window.adjustTextSize = (delta) => {
    let size = parseInt(localStorage.getItem('pc_font_size') || '100');
    size = Math.min(130, Math.max(80, size + delta));
    localStorage.setItem('pc_font_size', size);
    document.documentElement.style.fontSize = size + '%';
    
    const indicators = document.querySelectorAll('.pc-acc-size-indicator');
    indicators.forEach(ind => ind.textContent = size + '%');
};

window.resetTextSize = () => {
    localStorage.setItem('pc_font_size', '100');
    document.documentElement.style.fontSize = '100%';
    
    const indicators = document.querySelectorAll('.pc-acc-size-indicator');
    indicators.forEach(ind => ind.textContent = '100%');
};

// Fire initialization payload
DB.initData();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initAnnouncementBanner, 0);
        setTimeout(initNavbarAuth, 0);
        setTimeout(initAccessibilityWidget, 0);
    });
} else {
    if (document.body) {
        setTimeout(initAnnouncementBanner, 0);
        setTimeout(initNavbarAuth, 0);
        setTimeout(initAccessibilityWidget, 0);
    } else {
        window.addEventListener('load', () => {
            initAnnouncementBanner();
            initNavbarAuth();
            initAccessibilityWidget();
        });
    }
}

