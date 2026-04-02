document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value.trim().toLowerCase();
            
            if (userId.startsWith('t')) {
                // Determine if valid teacher (we just mock authentication for now context)
                DB.setCurrentUser({ id: userId, role: 'teacher' });
                window.location.href = 'teacher-dashboard.html';
            } else if (userId.startsWith('s')) {
                // Must exist in DB for student, or we allow any 's' ID to simulate 
                let students = DB.getStudents();
                let student = students.find(s => s.id.toLowerCase() === userId);
                
                if (!student) {
                    loginError.textContent = "Student ID not found in database. Please ask teacher to add you.";
                    loginError.style.display = 'block';
                } else {
                    DB.setCurrentUser({ id: userId, role: 'student', name: student.name });
                    window.location.href = 'student-dashboard.html';
                }
            } else {
                loginError.textContent = "Invalid User ID. Must start with 't' for teachers or 's' for students.";
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
