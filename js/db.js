const DB = {
    getStudents: () => JSON.parse(localStorage.getItem('pc_students') || '[]'),
    setStudents: (students) => localStorage.setItem('pc_students', JSON.stringify(students)),
    
    getTests: () => JSON.parse(localStorage.getItem('pc_tests') || '[]'),
    setTests: (tests) => localStorage.setItem('pc_tests', JSON.stringify(tests)),

    getCurrentUser: () => JSON.parse(localStorage.getItem('pc_currentUser') || 'null'),
    setCurrentUser: (user) => localStorage.setItem('pc_currentUser', JSON.stringify(user)),
    logout: () => localStorage.removeItem('pc_currentUser'),
    
    initData: () => {
        if (!localStorage.getItem('pc_students')) {
            DB.setStudents([
                { id: 's101', name: 'Ananya Sharma' },
                { id: 's102', name: 'Rahul Verma' },
                { id: 's103', name: 'Priya Patel' }
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
