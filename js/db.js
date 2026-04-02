const DB = {
    getStudents: () => JSON.parse(localStorage.getItem('pc_students') || '[]'),
    setStudents: (students) => localStorage.setItem('pc_students', JSON.stringify(students)),
    
    getTeachers: () => JSON.parse(localStorage.getItem('pc_teachers') || '[]'),
    setTeachers: (teachers) => localStorage.setItem('pc_teachers', JSON.stringify(teachers)),
    
    getSalaries: () => JSON.parse(localStorage.getItem('pc_salaries') || '[]'),
    setSalaries: (salaries) => localStorage.setItem('pc_salaries', JSON.stringify(salaries)),
    
    getAdmin: () => JSON.parse(localStorage.getItem('pc_admin') || '{"id":"admin", "password":"admin123"}'),
    setAdmin: (admin) => localStorage.setItem('pc_admin', JSON.stringify(admin)),

    getTests: () => JSON.parse(localStorage.getItem('pc_tests') || '[]'),
    setTests: (tests) => localStorage.setItem('pc_tests', JSON.stringify(tests)),

    getCurrentUser: () => JSON.parse(localStorage.getItem('pc_currentUser') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('pc_currentUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('pc_currentUser'),
    
    initData: () => {
        if (!localStorage.getItem('pc_students')) {
            DB.setStudents([
                { id: 's101', name: 'Ananya Sharma', password: 'password123' },
                { id: 's102', name: 'Rahul Verma', password: 'password123' },
                { id: 's103', name: 'Priya Patel', password: 'password123' }
            ]);
        }
        if (!localStorage.getItem('pc_teachers')) {
            DB.setTeachers([
                { id: 't201', name: 'Dr. R.K. Singh', password: 'password123' }
            ]);
        }
        // Schema Migration v2: Wipes old cache layout so passwords inject correctly
        if (localStorage.getItem('db_schema_v2') !== 'true') {
            localStorage.removeItem('pc_students');
            localStorage.removeItem('pc_teachers');
            localStorage.removeItem('pc_salaries');
            localStorage.removeItem('pc_tests');
            localStorage.removeItem('pc_admin');
            localStorage.removeItem('pc_currentUser');
            localStorage.setItem('db_schema_v2', 'true');
        }

        if (!localStorage.getItem('pc_salaries')) {
            DB.setSalaries([]);
        }
        if (!localStorage.getItem('pc_tests')) {
            DB.setTests([]);
        }
    }
};

// Initialize mock data when the script loads
DB.initData();

