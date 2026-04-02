document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = Auth.checkAuth('student');
    if (!user) return;

    document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}`;

    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const cumulativeScoreEl = document.getElementById('cumulativeScore');

    async function renderResults() {
        const tests = await DB.getTests();
        // Only show published tests
        const publishedTests = tests.filter(t => t.published);
        
        let totalMax = 0;
        let totalObtained = 0;
        
        resultsTableBody.innerHTML = '';
        
        let hasResults = false;

        publishedTests.forEach(test => {
            const studentMarkObj = test.marks.find(m => m.studentId === user.id);
            if (studentMarkObj) {
                hasResults = true;
                const mark = studentMarkObj.mark;
                const max = test.maxMarks;
                const percentage = ((mark / max) * 100).toFixed(1);
                
                totalMax += max;
                totalObtained += mark;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${test.date}</td>
                    <td>${test.subject}</td>
                    <td class="text-right">${max}</td>
                    <td class="text-right" style="font-weight:700;">${mark}</td>
                    <td class="text-right">
                        <span style="color: ${percentage >= 80 ? '#166534' : (percentage >= 50 ? '#854d0e' : '#dc2626')}">${percentage}%</span>
                    </td>
                `;
                resultsTableBody.appendChild(tr);
            }
        });

        if (!hasResults) {
            resultsTableBody.innerHTML = '<tr><td colspan="5" class="text-center" style="text-align:center;">No test results available yet.</td></tr>';
            cumulativeScoreEl.textContent = 'N/A';
        } else {
            const overall = ((totalObtained / totalMax) * 100).toFixed(1);
            cumulativeScoreEl.textContent = `${overall}%`;
        }
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        DB.logout();
        window.location.href = 'index.html';
    });

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value.trim();
            if(!newPassword) return;

            let students = await DB.getStudents();
            let idx = students.findIndex(s => s.id === user.id);
            if(idx !== -1) {
                students[idx].password = newPassword;
                await DB.setStudents(students);
                alert("Password updated successfully! Please log in again.");
                DB.logout();
                window.location.href = 'login.html';
            }
        });
    }

    await renderResults();
});
