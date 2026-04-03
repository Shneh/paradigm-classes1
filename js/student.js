document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = Auth.checkAuth('student');
    if (!user) return;

    document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}`;

    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const cumulativeScoreEl = document.getElementById('cumulativeScore');
    const feeCyclesTableBody = document.querySelector('#feeCyclesTable tbody');

    async function renderFees() {
        const students = await DB.getStudents();
        const student = students.find(s => s.id === user.id);
        if(!student || !student.dateOfJoining) {
            if(feeCyclesTableBody) {
                feeCyclesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No joining date recorded. Please contact Admin.</td></tr>';
            }
            return;
        }

        const payments = student.feePayments || [];
        const baseFees = student.fees || 0;

        let cycleStartDate = new Date(student.dateOfJoining);
        let cycleNum = 1;
        const today = new Date();
        
        if(feeCyclesTableBody) feeCyclesTableBody.innerHTML = '';
        
        while (cycleStartDate <= today || cycleNum === 1) { 
            const startStr = cycleStartDate.toISOString().split('T')[0];
            const endCycle = new Date(cycleStartDate);
            endCycle.setDate(endCycle.getDate() + 30);
            const endStr = endCycle.toISOString().split('T')[0];

            let rowHtml = `<td>Cycle ${cycleNum}</td><td>${DB.formatDate(startStr)}</td><td>${DB.formatDate(endStr)}</td><td class="text-right">₹${baseFees.toLocaleString('en-IN')}</td>`;
            
            const paymentRecord = payments.find(p => p.cycleStart === startStr);
            if (paymentRecord) {
                rowHtml += `
                    <td class="text-right" style="color:var(--text-light);">₹${paymentRecord.finePaid || 0}</td>
                    <td><span class="badge badge-success" style="background:#dcfce7;color:#166534;padding:0.25rem 0.5rem;border-radius:99px;font-weight:700;">Paid</span><br><small>by ${paymentRecord.markedBy}</small><br><small>on ${DB.formatDate(paymentRecord.paidOn)}</small></td>
                `;
            } else {
                const dueDate = new Date(cycleStartDate);
                dueDate.setDate(dueDate.getDate() + 5);
                const delayDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
                const currentFine = delayDays * 30;
                
                rowHtml += `
                    <td class="text-right" style="color: #b91c1c;">₹${currentFine}</td>
                    <td><span class="badge badge-warning" style="background:#fef08a;color:#854d0e;padding:0.25rem 0.5rem;border-radius:99px;font-weight:700;">Unpaid</span></td>
                `;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            if(feeCyclesTableBody) feeCyclesTableBody.appendChild(tr);

            cycleStartDate = endCycle;
            cycleNum++;
        }
    }

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
                    <td>${DB.formatDate(test.date)}</td>
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

    await renderFees();
    await renderResults();
});
