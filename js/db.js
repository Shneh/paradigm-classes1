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
            alert(`Database Read Error: Firebase is blocking data access. Please set Firestore Security Rules to 'true'.\n\n${error.message}`);
        }
        return [];
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
    
    getTeachers: async () => await getList('teachers'),
    setTeachers: async (teachers) => await setList('teachers', teachers),
    
    getSalaries: async () => await getList('salaries'),
    setSalaries: async (salaries) => await setList('salaries', salaries),
    
    getAdmin: async () => {
        try {
            const snapshot = await db.collection('appData').doc('admin').get();
            if (snapshot.exists) {
                return snapshot.data();
            }
            return { id: "admin", password: "admin123" };
        } catch (e) {
            return { id: "admin", password: "admin123" };
        }
    },
    setAdmin: async (admin) => {
        await db.collection('appData').doc('admin').set(admin);
    },

    getTests: async () => await getList('tests'),
    setTests: async (tests) => await setList('tests', tests),

    // currentUser remains in localStorage since it's session-based per physical device
    getCurrentUser: () => JSON.parse(localStorage.getItem('pc_currentUser') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('pc_currentUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('pc_currentUser'),
    
    initData: async () => {
        // Initialize default data only if it completely doesn't exist in Firestore
        const students = await DB.getStudents();
        if (students.length === 0) {
            await DB.setStudents([
                { id: 's101', name: 'Ananya Sharma', class: 'XII', password: 'password123' },
                { id: 's102', name: 'Rahul Verma', class: 'XI', password: 'password123' },
                { id: 's103', name: 'Priya Patel', class: 'NDA', password: 'password123' }
            ]);
        }
        
        const teachers = await DB.getTeachers();
        if (teachers.length === 0) {
            await DB.setTeachers([
                { id: 't201', name: 'Dr. R.K. Singh', password: 'password123' }
            ]);
        }

        const admin = await DB.getAdmin();
        if (admin.id === 'admin' && admin.password === 'admin123') {
            await DB.setAdmin(admin);
        }
    }
};

// Fire initialization payload
DB.initData();

