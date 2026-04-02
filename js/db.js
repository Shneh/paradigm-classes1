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
        if (!localStorage.getItem('pc_salaries')) {
            DB.setSalaries([
                { id: 1, teacherId: 't201', month: '2025-04', amount: 45000, dateIssued: new Date().toISOString().split('T')[0] }
            ]);
        }
        if (!localStorage.getItem('pc_tests')) {
            DB.setTests([
                {
                    id: 1,
                    subject: 'Physics',
                    maxMarks: 100,
                    date: new Date().toISOString().split('T')[0],
                    marks: [{ studentId: 's101', mark: 95 }, { studentId: 's102', mark: 88 }, { studentId: 's103', mark: 92 }],
                    published: true
                }
            ]);
        }
    }
};

// Initialize mock data when the script loads
DB.initData();

