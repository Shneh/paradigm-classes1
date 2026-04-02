document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value.trim().toLowerCase();
            const password = document.getElementById('password').value.trim();
            
            const adminData = DB.getAdmin();
            if (userId === adminData.id.toLowerCase()) {
                if (password === adminData.password) {
                    DB.setCurrentUser({ id: adminData.id, role: 'admin', name: 'Super Admin' });
                    window.location.href = 'admin-dashboard.html';
                } else {
                    loginError.textContent = "Incorrect admin password.";
                    loginError.style.display = 'block';
                }
            } else if (userId.startsWith('t')) {
                let teachers = DB.getTeachers();
                let teacher = teachers.find(t => t.id.toLowerCase() === userId);
                
                if (!teacher) {
                    loginError.textContent = "Teacher ID not found. Contact Admin.";
                    loginError.style.display = 'block';
                } else if (teacher.password !== password) {
                    loginError.textContent = "Incorrect password.";
                    loginError.style.display = 'block';
                } else {
                    DB.setCurrentUser({ id: userId, role: 'teacher', name: teacher.name });
                    window.location.href = 'teacher-dashboard.html';
                }
            } else if (userId.startsWith('s')) {
                let students = DB.getStudents();
                let student = students.find(s => s.id.toLowerCase() === userId);
                
                if (!student) {
                    loginError.textContent = "Student ID not found in database. Contact Admin.";
                    loginError.style.display = 'block';
                } else if (student.password !== password) {
                    loginError.textContent = "Incorrect password.";
                    loginError.style.display = 'block';
                } else {
                    DB.setCurrentUser({ id: userId, role: 'student', name: student.name });
                    window.location.href = 'student-dashboard.html';
                }
            } else {
                loginError.textContent = "Invalid User ID.";
                loginError.style.display = 'block';
            }
        });
    }

    // Helper for protected pages
    const checkAuth = (requiredRole) => {
        const user = DB.getCurrentUser();
        if (!user || user.role !== requiredRole) {
            window.location.href = 'login.html';
        }
        return user;
    };

    window.Auth = { checkAuth };
});
