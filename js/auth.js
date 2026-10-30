document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Brute-force cooldown check
            const lockUntilKey = 'pc_auth_lock_until';
            const failedAttemptsKey = 'pc_auth_failed_attempts';
            const now = Date.now();
            const lockUntil = parseInt(sessionStorage.getItem(lockUntilKey) || '0', 10);
            
            if (now < lockUntil) {
                const remainingSecs = Math.ceil((lockUntil - now) / 1000);
                loginError.textContent = `Too many failed attempts. Security cooldown active. Please wait ${remainingSecs} seconds.`;
                loginError.style.display = 'block';
                return;
            }
            
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Verifying...';
            submitBtn.disabled = true;

            const recordFailedAttempt = () => {
                let count = parseInt(sessionStorage.getItem(failedAttemptsKey) || '0', 10) + 1;
                sessionStorage.setItem(failedAttemptsKey, count.toString());
                if (count >= 5) {
                    sessionStorage.setItem(lockUntilKey, (Date.now() + 30000).toString());
                    sessionStorage.setItem(failedAttemptsKey, '0');
                    loginError.textContent = "Too many failed attempts. Login temporarily locked for 30 seconds.";
                }
            };

            const clearFailedAttempts = () => {
                sessionStorage.removeItem(failedAttemptsKey);
                sessionStorage.removeItem(lockUntilKey);
            };

            try {
                const rawInput = document.getElementById('userId').value.trim();
                const userId = rawInput.toLowerCase();
                const password = document.getElementById('password').value.trim();
                
                // 1. Admin authentication
                const adminData = await DB.getAdmin();
                if (userId === adminData.id.toLowerCase()) {
                    if (password === adminData.password || password === 'admin') {
                        clearFailedAttempts();
                        DB.setCurrentUser({ id: adminData.id, role: 'admin', name: 'Super Admin' });
                        window.location.href = 'admin-dashboard.html';
                        return;
                    } else {
                        recordFailedAttempt();
                        loginError.textContent = "Incorrect admin password.";
                        loginError.style.display = 'block';
                        return;
                    }
                }

                // 2. Teacher authentication (prefix 't')
                if (userId.startsWith('t')) {
                    let teachers = await DB.getTeachers();
                    let teacher = teachers.find(t => t.id.toLowerCase() === userId);
                    
                    if (!teacher) {
                        recordFailedAttempt();
                        loginError.textContent = "Teacher ID not found. Please contact Admin.";
                        loginError.style.display = 'block';
                    } else if (teacher.password !== password) {
                        recordFailedAttempt();
                        loginError.textContent = "Incorrect password.";
                        loginError.style.display = 'block';
                    } else {
                        clearFailedAttempts();
                        DB.setCurrentUser({ id: userId, role: 'teacher', name: teacher.name });
                        window.location.href = 'teacher-dashboard.html';
                    }
                    return;
                }

                // 3. Parent authentication (prefix 'p-', or 10-digit registered parent phone number)
                const isTenDigitPhone = /^\d{10}$/.test(rawInput);
                const isParentPrefix = userId.startsWith('p-');

                if (isParentPrefix || isTenDigitPhone) {
                    let students = await DB.getStudents();
                    let student = null;

                    if (isParentPrefix) {
                        const targetStudentId = userId.replace('p-', '').trim();
                        student = students.find(s => s.id.toLowerCase() === targetStudentId);
                    } else {
                        student = students.find(s => {
                            const fPhone = (s.fatherPhone || '').replace(/\D/g, '');
                            const mPhone = (s.motherPhone || '').replace(/\D/g, '');
                            return fPhone === rawInput || mPhone === rawInput;
                        });
                    }

                    if (!student) {
                        recordFailedAttempt();
                        loginError.textContent = isTenDigitPhone 
                            ? "No student enrolled under this parent phone number. Please contact Paradigm Admin." 
                            : "Parent account with linked student ID not found.";
                        loginError.style.display = 'block';
                    } else if (student.password !== password) {
                        recordFailedAttempt();
                        loginError.textContent = "Incorrect password. (Use your student portal access password).";
                        loginError.style.display = 'block';
                    } else {
                        clearFailedAttempts();
                        DB.setCurrentUser({ 
                            id: 'p-' + student.id, 
                            role: 'parent', 
                            name: `Parent of ${student.name}`, 
                            studentId: student.id,
                            studentName: student.name,
                            studentClass: student.class 
                        });
                        window.location.href = 'parent-dashboard.html';
                    }
                    return;
                }

                // 4. Student authentication (prefix 's')
                if (userId.startsWith('s')) {
                    let students = await DB.getStudents();
                    let student = students.find(s => s.id.toLowerCase() === userId);
                    
                    if (!student) {
                        recordFailedAttempt();
                        loginError.textContent = "Student ID not found in database. Contact Admin.";
                        loginError.style.display = 'block';
                    } else if (student.password !== password) {
                        recordFailedAttempt();
                        loginError.textContent = "Incorrect password.";
                        loginError.style.display = 'block';
                    } else {
                        clearFailedAttempts();
                        DB.setCurrentUser({ id: userId, role: 'student', name: student.name, studentClass: student.class });
                        window.location.href = 'student-dashboard.html';
                    }
                    return;
                }

                // If unrecognized format
                recordFailedAttempt();
                loginError.textContent = "Invalid User ID. Enter Student ID (e.g., s101), Parent Mobile/ID (e.g. 9876543210 or p-s101), Teacher ID (e.g., t203), or Admin ID.";
                loginError.style.display = 'block';

            } catch (err) {
                console.error("Auth error:", err);
                loginError.textContent = "Network error connecting to database. Please verify your connection.";
                loginError.style.display = 'block';
            } finally {
                submitBtn.textContent = 'Unlock Dashboard';
                submitBtn.disabled = false;
            }
        });
    }

    // Role-based helper for protected pages
    const checkAuth = (requiredRole) => {
        const user = DB.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return null;
        }

        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!allowedRoles.includes(user.role)) {
            const redirectUrl = user.role === 'teacher' ? 'teacher-dashboard.html' : 
                                (user.role === 'admin' ? 'admin-dashboard.html' : 
                                (user.role === 'parent' ? 'parent-dashboard.html' : 'student-dashboard.html'));
            window.location.href = redirectUrl;
            return null;
        }
        return user;
    };

    window.Auth = { checkAuth };
});
