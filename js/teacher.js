document.addEventListener('DOMContentLoaded', async () => {
    // Standard auth check
    const user = Auth.checkAuth('teacher');
    if (!user) return;

    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.name}`;
    }

    // Load dynamic current salary
    const teachers = await DB.getTeachers();
    const currentTeacher = teachers.find(t => t.id === user.id);
    if (currentTeacher) {
        const salaryEl = document.getElementById('teacherCurrentSalary');
        if (salaryEl) {
            salaryEl.textContent = `₹${(currentTeacher.currentSalary || 0).toLocaleString('en-IN')}`;
        }
    }

    // DOM Elements
    const testsList = document.getElementById('testsList');
    const studentsTableBody = document.querySelector('#studentsTable tbody');
    const addTestForm = document.getElementById('add-test-form');
    const addStudentForm = document.getElementById('add-student-form');
    
    const markEntryPanel = document.getElementById('markEntryPanel');
    const marksTableBody = document.querySelector('#marksTable tbody');
    const feedMarksForm = document.getElementById('feed-marks-form');
    const markEntrySubject = document.getElementById('markEntrySubject');
    let currentEditingTestId = null;

    const feeStudentIdSelect = document.getElementById('feeStudentId');
    const feeCyclesTableBody = document.querySelector('#feeCyclesTable tbody');

    // Render Data functions
    async function renderSalaries() {
        const salariesTableBody = document.querySelector('#salariesTable tbody');
        if(!salariesTableBody) return;
        
        const allSalaries = await DB.getSalaries();
        const salaries = allSalaries.filter(s => s.teacherId === user.id);
        salariesTableBody.innerHTML = '';
        
        if (salaries.length === 0) {
            salariesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No salary records found.</td></tr>';
            return;
        }

        salaries.forEach(salary => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${salary.month}</td>
                <td>${DB.formatDate(salary.dateIssued)}</td>
                <td class="text-right" style="text-align: right; font-weight: 700; color: var(--primary-color);">₹${salary.amount.toLocaleString('en-IN')}</td>
            `;
            salariesTableBody.appendChild(tr);
        });
    }

    async function renderTests() {
        const tests = await DB.getTests();
        testsList.innerHTML = '';
        if (tests.length === 0) {
            testsList.innerHTML = '<p>No tests created yet.</p>';
            return;
        }

        tests.forEach(test => {
            const div = document.createElement('div');
            div.className = 'list-group-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight: 700;">${test.subject}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light);">Max Marks: ${test.maxMarks} | Date: ${DB.formatDate(test.date)}</div>
                    <div style="margin-top: 0.2rem;">
                        <span class="badge ${test.published ? 'badge-success' : 'badge-warning'}">${test.published ? 'Published' : 'Draft'}</span>
                    </div>
                </div>
                <div class="test-actions">
                    <button class="btn btn-outline" style="color: #dc2626; border-color: #dc2626;" onclick="removeTest(${test.id})">Remove</button>
                    <button class="btn btn-outline" onclick="openMarkEntry(${test.id})">Feed Marks</button>
                    ${!test.published ? `<button class="btn btn-primary" onclick="publishTest(${test.id})">Publish</button>` : ''}
                </div>
            `;
            testsList.appendChild(div);
        });

        // Also populate feeStudents
        if (feeStudentIdSelect) {
            const students = await DB.getStudents();
            feeStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
            students.forEach(student => {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.textContent = `${student.name} (${student.id})`;
                feeStudentIdSelect.appendChild(opt);
            });
        }
    }

    // Handlers
    window.removeTest = async (testId) => {
        if(confirm('Are you sure you want to permanently delete this test and all its marks?')) {
            let tests = await DB.getTests();
            tests = tests.filter(t => t.id !== testId);
            await DB.setTests(tests);
            await renderTests();
        }
    };

    window.openMarkEntry = async (testId) => {
        const tests = await DB.getTests();
        const test = tests.find(t => t.id === testId);
        if(!test) return;

        currentEditingTestId = testId;
        markEntrySubject.textContent = `Subject: ${test.subject} (Max: ${test.maxMarks})`;
        markEntryPanel.style.display = 'block';

        const students = await DB.getStudents();
        marksTableBody.innerHTML = '';
        
        students.forEach(student => {
            // Check if mark already exists
            const existingMark = test.marks.find(m => m.studentId === student.id);
            const markVal = existingMark ? existingMark.mark : '';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>
                    <input type="number" class="form-input mark-input" style="padding:0.4rem;" data-id="${student.id}" value="${markVal}" min="0" max="${test.maxMarks}">
                </td>
            `;
            marksTableBody.appendChild(tr);
        });
    };

    window.publishTest = async (testId) => {
        if(confirm('Are you sure you want to publish? Students will be able to see the results.')) {
            let tests = await DB.getTests();
            const idx = tests.findIndex(t => t.id === testId);
            if(idx !== -1) {
                tests[idx].published = true;
                await DB.setTests(tests);
                await renderTests();
            }
        }
    };

    document.getElementById('closeMarkPanel').addEventListener('click', () => {
        markEntryPanel.style.display = 'none';
        currentEditingTestId = null;
    });

    if (feeStudentIdSelect) {
        feeStudentIdSelect.addEventListener('change', (e) => {
            renderFeeCycles(e.target.value);
        });
    }

    window.markFeePaid = async (studentId, cycleStart) => {
        const students = await DB.getStudents();
        const studentIndex = students.findIndex(s => s.id === studentId);
        if(studentIndex === -1) return;
        const student = students[studentIndex];
        if(!student.feePayments) student.feePayments = [];
        
        // Compute the fine locked in at the time of payment
        const startDate = new Date(cycleStart);
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 5);
        const today = new Date();
        const delayDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        const fineLock = delayDays * 30;

        student.feePayments.push({
            cycleStart,
            finePaid: fineLock,
            paidOn: new Date().toISOString().split('T')[0],
            markedBy: user.name
        });

        await DB.setStudents(students);
        renderFeeCycles(studentId);
        alert('Fees marked as paid.');
    };

    async function renderFeeCycles(studentId) {
        if(!feeCyclesTableBody) return;
        feeCyclesTableBody.innerHTML = '';
        const students = await DB.getStudents();
        const student = students.find(s => s.id === studentId);
        if(!student || !student.dateOfJoining) {
            feeCyclesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No valid Date of Joining found!</td></tr>';
            return;
        }

        const payments = student.feePayments || [];
        const baseFees = student.fees || 0;

        let cycleStartDate = new Date(student.dateOfJoining);
        let cycleNum = 1;
        const today = new Date();
        
        // Loop up to current date cycle
        while (cycleStartDate <= today || cycleNum === 1) { // ensure at least one cycle
            const startStr = cycleStartDate.toISOString().split('T')[0];
            const endCycle = new Date(cycleStartDate);
            endCycle.setDate(endCycle.getDate() + 30);
            const endStr = endCycle.toISOString().split('T')[0];

            let rowHtml = `<td>Cycle ${cycleNum}</td><td>${DB.formatDate(startStr)}</td><td>${DB.formatDate(endStr)}</td>`;
            
            const paymentRecord = payments.find(p => p.cycleStart === startStr);
            if (paymentRecord) {
                const totalPaid = baseFees + (paymentRecord.finePaid || 0);
                rowHtml += `
                    <td class="text-right">₹${totalPaid.toLocaleString('en-IN')} <br><small style="color:var(--text-light);">(Fine: ₹${paymentRecord.finePaid || 0})</small></td>
                    <td><span class="badge badge-success" style="background:#dcfce7;color:#166534;">Paid</span><br><small>by ${paymentRecord.markedBy}</small><br><small>on ${DB.formatDate(paymentRecord.paidOn)}</small></td>
                    <td>-</td>
                `;
            } else {
                // Compute current fine
                const dueDate = new Date(cycleStartDate);
                dueDate.setDate(dueDate.getDate() + 5);
                const delayDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
                const currentFine = delayDays * 30;
                const totalDue = baseFees + currentFine;
                
                rowHtml += `
                    <td class="text-right" style="color: #b91c1c;">₹${totalDue.toLocaleString('en-IN')} <br><small style="color:var(--text-light);">(Fine: ₹${currentFine})</small></td>
                    <td><span class="badge badge-warning" style="background:#fef08a;color:#854d0e;">Unpaid</span></td>
                    <td><button class="btn btn-primary" style="padding: 0.2rem 0.6rem; font-size: 0.85rem;" onclick="markFeePaid('${student.id}', '${startStr}')">Mark Paid</button></td>
                `;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            feeCyclesTableBody.appendChild(tr);

            cycleStartDate = endCycle;
            cycleNum++;
        }
    }

    // Form Submits

    addTestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const subject = document.getElementById('testSubject').value;
        const maxMarks = parseInt(document.getElementById('testMaxMarks').value);
        
        const tests = await DB.getTests();
        const newId = tests.length > 0 ? Math.max(...tests.map(t => t.id)) + 1 : 1;
        
        tests.unshift({
            id: newId,
            subject,
            maxMarks,
            date: new Date().toISOString().split('T')[0],
            marks: [],
            published: false
        });
        
        await DB.setTests(tests);
        addTestForm.reset();
        await renderTests();
    });

    feedMarksForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!currentEditingTestId) return;

        const inputs = document.querySelectorAll('.mark-input');
        let newMarks = [];
        inputs.forEach(input => {
            if(input.value !== '') {
                newMarks.push({
                    studentId: input.dataset.id,
                    mark: parseFloat(input.value)
                });
            }
        });

        const tests = await DB.getTests();
        const idx = tests.findIndex(t => t.id === currentEditingTestId);
        if(idx !== -1) {
            tests[idx].marks = newMarks;
            await DB.setTests(tests);
            alert('Marks saved successfully!');
            markEntryPanel.style.display = 'none';
        }
    });

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

            let teachers = await DB.getTeachers();
            let idx = teachers.findIndex(t => t.id === user.id);
            if(idx !== -1) {
                teachers[idx].password = newPassword;
                await DB.setTeachers(teachers);
                alert("Password updated successfully! Please log in again.");
                DB.logout();
                window.location.href = 'login.html';
            }
        });
    }

    // Initial render
    await renderSalaries();
    await renderTests();
});
