document.addEventListener('DOMContentLoaded', async () => {
    // Standard auth check
    const user = Auth.checkAuth('admin');
    if (!user) return;

    // DOM Elements
    const studentsTableBody = document.querySelector('#studentsTable tbody');
    const teachersTableBody = document.querySelector('#teachersTable tbody');
    const salariesTableBody = document.querySelector('#salariesTable tbody');
    
    const addStudentForm = document.getElementById('add-student-form');
    const updateStudentForm = document.getElementById('update-student-form');
    const updateStudentIdSelect = document.getElementById('updateStudentId');
    const updateStudentDojInput = document.getElementById('updateStudentDoj');
    const updateStudentFeesInput = document.getElementById('updateStudentFees');
    const feeStudentIdSelect = document.getElementById('feeStudentId');
    const feeCyclesTableBody = document.querySelector('#feeCyclesTable tbody');
    const addTeacherForm = document.getElementById('add-teacher-form');
    const updateTeacherSalaryForm = document.getElementById('update-teacher-salary-form');
    const updateSalaryTeacherIdSelect = document.getElementById('updateSalaryTeacherId');
    const updateSalaryAmountInput = document.getElementById('updateSalaryAmount');
    const addSalaryForm = document.getElementById('add-salary-form');
    const salaryTeacherIdSelect = document.getElementById('salaryTeacherId');

    // Render Functions
    async function renderStudents() {
        const students = await DB.getStudents();
        studentsTableBody.innerHTML = '';
        if(updateStudentIdSelect) updateStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
        if(feeStudentIdSelect) feeStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
        
        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td><span class="badge" style="background:#e2e8f0; color:#475569;">${student.class || 'N/A'}</span></td>
                <td style="font-family: monospace; color: var(--primary-light);">${student.password}</td>
                <td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeStudent('${student.id}')">Remove</button></td>
            `;
            studentsTableBody.appendChild(tr);

            if(updateStudentIdSelect) {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.textContent = `${student.name} (${student.id})`;
                updateStudentIdSelect.appendChild(opt);
            }
            if(feeStudentIdSelect) {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.textContent = `${student.name} (${student.id})`;
                feeStudentIdSelect.appendChild(opt);
            }
        });
    }

    async function renderTeachers() {
        const teachers = await DB.getTeachers();
        teachersTableBody.innerHTML = '';
        salaryTeacherIdSelect.innerHTML = '<option value="" disabled selected>-- Select Teacher --</option>';
        if (updateSalaryTeacherIdSelect) {
            updateSalaryTeacherIdSelect.innerHTML = '<option value="" disabled selected>-- Select Teacher --</option>';
        }

        teachers.forEach(teacher => {
            // Populate table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td style="font-family: monospace; color: var(--primary-light);">${teacher.password}</td>
                <td style="font-weight: bold; color: #166534;">₹${(teacher.currentSalary || 0).toLocaleString('en-IN')}</td>
                <td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeTeacher('${teacher.id}')">Remove</button></td>
            `;
            teachersTableBody.appendChild(tr);

            // Populate select dropdown for Salaries
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} (${teacher.id})`;
            salaryTeacherIdSelect.appendChild(option);
            
            if (updateSalaryTeacherIdSelect) {
                const opt2 = document.createElement('option');
                opt2.value = teacher.id;
                opt2.textContent = `${teacher.name} (${teacher.id})`;
                updateSalaryTeacherIdSelect.appendChild(opt2);
            }
        });
    }

    async function renderSalaries() {
        const salaries = await DB.getSalaries();
        const teachers = await DB.getTeachers();
        salariesTableBody.innerHTML = '';
        
        // Sort by newest first using ID
        const sortedSalaries = [...salaries].sort((a,b) => b.id - a.id);

        sortedSalaries.forEach(salary => {
            const teacher = teachers.find(t => t.id === salary.teacherId);
            const teacherName = teacher ? teacher.name : 'Unknown';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacherName} <span style="font-size:0.8rem; color:var(--text-light);">(${salary.teacherId})</span></td>
                <td>${salary.month}</td>
                <td class="text-right" style="text-align: right; font-weight: 700;">₹${salary.amount.toLocaleString('en-IN')}</td>
                <td class="text-right"><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeSalary(${salary.id})">Remove</button></td>
            `;
            salariesTableBody.appendChild(tr);
        });
    }

    // Removal Logic
    window.removeStudent = async (id) => {
        if(confirm(`Are you sure you want to completely remove student ${id}?`)) {
            let students = await DB.getStudents();
            students = students.filter(s => s.id !== id);
            await DB.setStudents(students);
            renderStudents();
        }
    };

    window.removeTeacher = async (id) => {
        if(confirm(`Are you sure you want to completely remove teacher ${id}?`)) {
            let teachers = await DB.getTeachers();
            teachers = teachers.filter(t => t.id !== id);
            await DB.setTeachers(teachers);
            renderTeachers();
        }
    };

    window.removeSalary = async (id) => {
        if(confirm(`Are you sure you want to void this salary payout?`)) {
            let salaries = await DB.getSalaries();
            salaries = salaries.filter(s => s.id !== id);
            await DB.setSalaries(salaries);
            renderSalaries();
        }
    };

    // Form Submissions
    addStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('studentName').value.trim();
        const studentClass = document.getElementById('studentClass').value.trim();
        const password = document.getElementById('studentPassword').value.trim();
        const doj = document.getElementById('studentDoj').value;
        const fees = parseFloat(document.getElementById('studentFees').value);
        
        const students = await DB.getStudents();
        
        // Generate chronological ID like s104
        const numIds = students.filter(s => s.id.startsWith('s')).map(s => parseInt(s.id.substring(1)) || 0);
        const maxId = numIds.length > 0 ? Math.max(...numIds) : 100;
        const newId = 's' + (maxId + 1);

        students.push({ 
            id: newId, 
            name, 
            class: studentClass, 
            password,
            dateOfJoining: doj,
            fees: fees || 0,
            feePayments: []
        });
        await DB.setStudents(students);
        
        addStudentForm.reset();
        renderStudents();
        alert(`Successfully added ${name}. Logic ID assigned: ${newId}`);
    });

    addTeacherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('teacherName').value.trim();
        const password = document.getElementById('teacherPassword').value.trim();
        const teachers = await DB.getTeachers();
        
        // Generate chronological ID like t201
        const numIds = teachers.filter(t => t.id.startsWith('t')).map(t => parseInt(t.id.substring(1)) || 0);
        const maxId = numIds.length > 0 ? Math.max(...numIds) : 200;
        const newId = 't' + (maxId + 1);

        teachers.push({ id: newId, name, password, currentSalary: 0 });
        await DB.setTeachers(teachers);
        
        addTeacherForm.reset();
        renderTeachers(); // Will also re-render the dropdown list!
        alert(`Successfully added ${name}. Logic ID assigned: ${newId}`);
    });

    addSalaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const teacherId = document.getElementById('salaryTeacherId').value;
        const month = document.getElementById('salaryMonth').value;
        const amount = parseFloat(document.getElementById('salaryAmount').value);

        if(!teacherId) return alert("Select a teacher first.");
        
        const salaries = await DB.getSalaries();
        const newId = salaries.length > 0 ? Math.max(...salaries.map(s => s.id)) + 1 : 1;

        salaries.push({
            id: newId,
            teacherId,
            month,
            amount,
            dateIssued: new Date().toISOString().split('T')[0]
        });

        await DB.setSalaries(salaries);
        addSalaryForm.reset();
        await renderSalaries();
        alert(`Salary issued!`);
    });

    if (updateStudentForm) {
        updateStudentIdSelect.addEventListener('change', async (e) => {
            const studentId = e.target.value;
            const students = await DB.getStudents();
            const student = students.find(s => s.id === studentId);
            if (student) {
                updateStudentDojInput.value = student.dateOfJoining || '';
                updateStudentFeesInput.value = student.fees || 0;
            }
        });

        updateStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentId = updateStudentIdSelect.value;
            if(!studentId) return alert('Select student');
            const students = await DB.getStudents();
            const idx = students.findIndex(s => s.id === studentId);
            if (idx !== -1) {
                students[idx].dateOfJoining = updateStudentDojInput.value;
                students[idx].fees = parseFloat(updateStudentFeesInput.value) || 0;
                if(!students[idx].feePayments) students[idx].feePayments = [];
                await DB.setStudents(students);
                alert('Student profile updated successfully!');
                if (feeStudentIdSelect && feeStudentIdSelect.value === studentId) {
                    renderFeeCycles(studentId);
                }
            }
        });
    }

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
            markedBy: 'Admin'
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
            feeCyclesTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No valid Date of Joining found! Please update student profile.</td></tr>';
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

    if (updateTeacherSalaryForm) {
        updateSalaryTeacherIdSelect.addEventListener('change', async (e) => {
            const teacherId = e.target.value;
            const teachers = await DB.getTeachers();
            const teacher = teachers.find(t => t.id === teacherId);
            if (teacher) {
                updateSalaryAmountInput.value = teacher.currentSalary || 0;
            }
        });

        updateTeacherSalaryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const teacherId = updateSalaryTeacherIdSelect.value;
            const amount = parseFloat(updateSalaryAmountInput.value);

            if (!teacherId || isNaN(amount)) return alert("Invalid inputs.");
            
            const teachers = await DB.getTeachers();
            const idx = teachers.findIndex(t => t.id === teacherId);
            if (idx !== -1) {
                teachers[idx].currentSalary = amount;
                await DB.setTeachers(teachers);
                await renderTeachers();
                alert('Teacher salary updated successfully!');
            }
        });
    }

    const updateAdminForm = document.getElementById('update-admin-form');
    if (updateAdminForm) {
        // Pre-fill the admin id input
        const currentAdmin = await DB.getAdmin();
        document.getElementById('adminIdInput').value = currentAdmin.id;
        
        updateAdminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newId = document.getElementById('adminIdInput').value.trim();
            const newPassword = document.getElementById('adminPasswordInput').value.trim();
            
            if (newId === '' || newPassword === '') {
                return alert("ID and Password cannot be empty.");
            }
            
            await DB.setAdmin({ id: newId, password: newPassword });
            
            // Also update the current session so the user doesn't get kicked out immediately
            // but we'll force a re-login to be safe
            alert(`Admin credentials successfully updated! Please log in again with your new credentials.`);
            DB.logout();
            window.location.href = 'login.html';
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        DB.logout();
        window.location.href = 'index.html';
    });

    // Initial render
    await renderStudents();
    await renderTeachers();
    await renderSalaries();
});
