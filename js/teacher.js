document.addEventListener('DOMContentLoaded', async () => {
    // Standard auth check
    const user = Auth.checkAuth('teacher');
    if (!user) return;

    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${user.name}`;
    }

    // Load dynamic current salary from student fee splits
    const students = await DB.getStudents();
    let dynamicSalary = 0;
    students.forEach(student => {
        const splits = student.feeSplits || [];
        const split = splits.find(s => s.teacherId.toLowerCase() === user.id.toLowerCase());
        if (split) {
            dynamicSalary += (student.fees || 0) * (split.percentage || 0) / 100;
        }
    });

    const salaryEl = document.getElementById('teacherCurrentSalary');
    if (salaryEl) {
        salaryEl.textContent = `₹${dynamicSalary.toLocaleString('en-IN')}`;
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

    // Attendance DOM Elements
    const attendanceDateInput = document.getElementById('attendanceDate');
    const attendanceTableBody = document.querySelector('#attendanceTable tbody');
    const saveAttendanceBtn = document.getElementById('saveAttendanceBtn');
    const attendanceOverviewTableBody = document.querySelector('#attendanceOverviewTable tbody');

    // Render Data functions
    async function renderSalaries() {
        const salariesTableBody = document.querySelector('#salariesTable tbody');
        if(!salariesTableBody) return;
        
        const allSalaries = await DB.getSalaries();
        const salaries = allSalaries.filter(s => s.teacherId.toLowerCase() === user.id.toLowerCase());
        salariesTableBody.innerHTML = '';
        
        // Month Selector logic
        const monthSelector = document.getElementById('salaryMonthSelector');
        const monthNamesFull = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
        if (monthSelector && monthSelector.options.length === 0) {
            const today = new Date();
            const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            const uniqueMonths = new Set();
            uniqueMonths.add(currentMonthStr);
            salaries.forEach(s => uniqueMonths.add(s.month));
            
            const sortedMonths = Array.from(uniqueMonths).sort().reverse();
            
            sortedMonths.forEach(mStr => {
                const [yyyy, mm] = mStr.split('-');
                const opt = document.createElement('option');
                opt.value = mStr;
                opt.textContent = `${monthNamesFull[parseInt(mm) - 1]} ${yyyy}`;
                monthSelector.appendChild(opt);
            });
            monthSelector.value = currentMonthStr;
        }

        let selectedMonthStr = monthSelector ? monthSelector.value : '';
        if (!selectedMonthStr) {
            const today = new Date();
            selectedMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        }
        
        let totalReceivedForMonth = 0;
        salariesTableBody.innerHTML = '';
        
        if (salaries.length === 0) {
            salariesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No salary records found.</td></tr>';
        } else {
            salaries.forEach(salary => {
                if (salary.month === selectedMonthStr) {
                    totalReceivedForMonth += salary.amount;
                }
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${salary.month}</td>
                    <td>${DB.formatDate(salary.dateIssued)}</td>
                    <td class="text-right" style="text-align: right; font-weight: 700; color: var(--primary-color);">₹${salary.amount.toLocaleString('en-IN')}</td>
                `;
                salariesTableBody.appendChild(tr);
            });
        }
        
        const monthlyReceivedEl = document.getElementById('teacherMonthlyReceived');
        if (monthlyReceivedEl) {
            monthlyReceivedEl.textContent = `₹${totalReceivedForMonth.toLocaleString('en-IN')}`;
        }
        const monthlyReceivedLabel = document.getElementById('teacherMonthlyReceivedLabel');
        if (monthlyReceivedLabel) {
            const [yyyy, mm] = selectedMonthStr.split('-');
            monthlyReceivedLabel.textContent = `For ${monthNamesFull[parseInt(mm) - 1]} ${yyyy}`;
        }
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
                    <button class="btn btn-outline" style="color: #dc2626; border-color: #dc2626; padding: 0.5rem 1rem; font-weight: 600;" onclick="removeTest(${test.id})">Remove</button>
                    <button class="btn btn-outline" style="color: #1e3a8a; border-color: #1e3a8a; background-color: #eff6ff; padding: 0.5rem 1rem; font-weight: 600;" onclick="openMarkEntry(${test.id})">Feed Marks</button>
                    ${!test.published ? `<button class="btn btn-primary" style="background-color: #166534; border-color: #166534; color: white; padding: 0.5rem 1rem; font-weight: 600;" onclick="publishTest(${test.id})">Publish</button>` : ''}
                </div>
            `;
            testsList.appendChild(div);
        });

    }

    async function renderFeeStudents() {
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

    window.markFeePaid = async (studentId, cycleStart, payDate) => {
        const students = await DB.getStudents();
        const studentIndex = students.findIndex(s => s.id === studentId);
        if(studentIndex === -1) return;
        const student = students[studentIndex];
        if(!student.feePayments) student.feePayments = [];
        
        const paymentDateStr = payDate || new Date().toISOString().split('T')[0];
        const payDateObj = new Date(paymentDateStr);

        // Compute the fine locked in at the time of payment
        const startDate = new Date(cycleStart);
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + 5);
        const delayDays = Math.max(0, Math.floor((payDateObj - dueDate) / (1000 * 60 * 60 * 24)));
        const fineLock = delayDays * 30;

        student.feePayments.push({
            cycleStart,
            finePaid: fineLock,
            paidOn: paymentDateStr,
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
                    <td style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <input type="date" id="payDate-${startStr}" class="form-input" style="padding: 0.2rem; font-size: 0.85rem;" value="${today.toISOString().split('T')[0]}">
                        <button class="btn btn-primary" style="padding: 0.2rem 0.6rem; font-size: 0.85rem;" onclick="markFeePaid('${student.id}', '${startStr}', document.getElementById('payDate-${startStr}').value)">Mark Paid</button>
                    </td>
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
            let idx = teachers.findIndex(t => t.id.toLowerCase() === user.id.toLowerCase());
            if(idx !== -1) {
                teachers[idx].password = newPassword;
                await DB.setTeachers(teachers);
                alert("Password updated successfully! Please log in again.");
                DB.logout();
                window.location.href = 'login.html';
            }
        });
    }

    // Attendance Logic implementation
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayStr = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

    if (attendanceDateInput) {
        attendanceDateInput.value = todayStr;
        attendanceDateInput.min = todayStr;
        attendanceDateInput.addEventListener('change', renderAttendanceForm);
    }

    async function renderAttendanceForm() {
        if (!attendanceTableBody || !attendanceDateInput) return;
        const selectedDate = attendanceDateInput.value;
        if (!selectedDate) return;

        const students = await DB.getStudents();
        const attendanceList = await DB.getAttendance();
        const dayRecord = attendanceList.find(r => r.date === selectedDate);
        
        attendanceTableBody.innerHTML = '';
        
        if (students.length === 0) {
            attendanceTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No active students found.</td></tr>';
            return;
        }

        students.forEach(student => {
            let status = 'present';
            if (dayRecord && dayRecord.records && dayRecord.records[student.id]) {
                status = dayRecord.records[student.id];
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td><strong>${student.name}</strong></td>
                <td style="text-align: center;">
                    <div class="attendance-toggle-group" style="display: flex; border: 1px solid var(--gray-300); border-radius: var(--radius-md); overflow: hidden; width: 120px; margin: 0 auto;" data-student-id="${student.id}" data-status="${status}">
                        <button type="button" class="toggle-btn present-btn" style="flex: 1; border: none; padding: 0.35rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">P</button>
                        <button type="button" class="toggle-btn absent-btn" style="flex: 1; border: none; padding: 0.35rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">A</button>
                    </div>
                </td>
            `;
            attendanceTableBody.appendChild(tr);

            const toggleGroup = tr.querySelector('.attendance-toggle-group');
            const pBtn = toggleGroup.querySelector('.present-btn');
            const aBtn = toggleGroup.querySelector('.absent-btn');

            function setUIStatus(newStatus) {
                toggleGroup.dataset.status = newStatus;
                if (newStatus === 'present') {
                    pBtn.style.backgroundColor = '#22c55e';
                    pBtn.style.color = 'white';
                    aBtn.style.backgroundColor = '#f1f5f9';
                    aBtn.style.color = 'var(--text-light)';
                } else {
                    aBtn.style.backgroundColor = '#ef4444';
                    aBtn.style.color = 'white';
                    pBtn.style.backgroundColor = '#f1f5f9';
                    pBtn.style.color = 'var(--text-light)';
                }
            }

            setUIStatus(status);

            pBtn.addEventListener('click', () => setUIStatus('present'));
            aBtn.addEventListener('click', () => setUIStatus('absent'));
        });
    }

    async function renderAttendanceOverview() {
        if (!attendanceOverviewTableBody) return;

        const students = await DB.getStudents();
        const attendanceList = await DB.getAttendance();

        attendanceOverviewTableBody.innerHTML = '';

        if (students.length === 0) {
            attendanceOverviewTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-light);">No active students.</td></tr>';
            return;
        }

        students.forEach(student => {
            let totalDays = 0;
            let presentDays = 0;

            attendanceList.forEach(day => {
                if (day.records && day.records[student.id]) {
                    totalDays++;
                    if (day.records[student.id] === 'present') {
                        presentDays++;
                    }
                }
            });

            const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : null;
            const percentageText = percentage !== null ? `${percentage}%` : 'N/A';
            const detailsText = totalDays > 0 ? `<small style="display:block; color:var(--text-light); font-size:0.75rem;">(${presentDays}/${totalDays} days)</small>` : '';

            let color = '#64748b';
            if (percentage !== null) {
                const pct = parseFloat(percentage);
                if (pct >= 85) {
                    color = '#166534';
                } else if (pct >= 75) {
                    color = '#b45309';
                } else {
                    color = '#b91c1c';
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td><strong>${student.name}</strong></td>
                <td><span class="badge" style="background:#e2e8f0; color:#475569;">${student.class || 'N/A'}</span></td>
                <td style="text-align: right;">
                    <span style="font-weight: 700; color: ${color};">${percentageText}</span>
                    ${detailsText}
                </td>
            `;
            attendanceOverviewTableBody.appendChild(tr);
        });
    }

    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', async () => {
            const selectedDate = attendanceDateInput.value;
            if (!selectedDate) {
                alert('Please select a valid date.');
                return;
            }

            if (selectedDate < todayStr) {
                alert('You can only take attendance from today onward.');
                return;
            }

            const toggleGroups = document.querySelectorAll('.attendance-toggle-group');
            const records = {};
            toggleGroups.forEach(group => {
                const studentId = group.dataset.studentId;
                const status = group.dataset.status;
                records[studentId] = status;
            });

            try {
                const attendanceList = await DB.getAttendance();
                const existingIdx = attendanceList.findIndex(r => r.date === selectedDate);
                
                const newRecord = {
                    date: selectedDate,
                    records: records,
                    takenBy: user.id
                };

                if (existingIdx !== -1) {
                    attendanceList[existingIdx] = newRecord;
                } else {
                    attendanceList.push(newRecord);
                }

                await DB.setAttendance(attendanceList);
                alert('Attendance saved successfully!');
                await renderAttendanceOverview();
            } catch (err) {
                console.error("Error saving attendance:", err);
                alert("Error saving attendance: " + err.message);
            }
        });
    }

    // Initial render
    await renderSalaries();
    await renderTests();
    await renderFeeStudents();
    await renderAttendanceForm();
    await renderAttendanceOverview();

    const salaryMonthSelector = document.getElementById('salaryMonthSelector');
    if (salaryMonthSelector) {
        salaryMonthSelector.addEventListener('change', renderSalaries);
    }
});
