document.addEventListener('DOMContentLoaded', () => {
    // Standard auth check
    const user = Auth.checkAuth('admin');
    if (!user) return;

    // DOM Elements
    const studentsTableBody = document.querySelector('#studentsTable tbody');
    const teachersTableBody = document.querySelector('#teachersTable tbody');
    const salariesTableBody = document.querySelector('#salariesTable tbody');
    
    const addStudentForm = document.getElementById('add-student-form');
    const addTeacherForm = document.getElementById('add-teacher-form');
    const addSalaryForm = document.getElementById('add-salary-form');
    const salaryTeacherIdSelect = document.getElementById('salaryTeacherId');

    // Render Functions
    function renderStudents() {
        const students = DB.getStudents();
        studentsTableBody.innerHTML = '';
        students.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td style="font-family: monospace; color: var(--primary-light);">${student.password}</td>
                <td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeStudent('${student.id}')">Remove</button></td>
            `;
            studentsTableBody.appendChild(tr);
        });
    }

    function renderTeachers() {
        const teachers = DB.getTeachers();
        teachersTableBody.innerHTML = '';
        salaryTeacherIdSelect.innerHTML = '<option value="" disabled selected>-- Select Teacher --</option>';

        teachers.forEach(teacher => {
            // Populate table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td style="font-family: monospace; color: var(--primary-light);">${teacher.password}</td>
                <td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeTeacher('${teacher.id}')">Remove</button></td>
            `;
            teachersTableBody.appendChild(tr);

            // Populate select dropdown for Salaries
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} (${teacher.id})`;
            salaryTeacherIdSelect.appendChild(option);
        });
    }

    function renderSalaries() {
        const salaries = DB.getSalaries();
        const teachers = DB.getTeachers();
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
            `;
            salariesTableBody.appendChild(tr);
        });
    }

    // Removal Logic
    window.removeStudent = (id) => {
        if(confirm(`Are you sure you want to completely remove student ${id}?`)) {
            let students = DB.getStudents();
            students = students.filter(s => s.id !== id);
            DB.setStudents(students);
            renderStudents();
        }
    };

    window.removeTeacher = (id) => {
        if(confirm(`Are you sure you want to completely remove teacher ${id}?`)) {
            let teachers = DB.getTeachers();
            teachers = teachers.filter(t => t.id !== id);
            DB.setTeachers(teachers);
            renderTeachers();
        }
    };

    // Form Submissions
    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('studentName').value.trim();
        const password = document.getElementById('studentPassword').value.trim();
        const students = DB.getStudents();
        
        // Generate chronological ID like s104
        const numIds = students.filter(s => s.id.startsWith('s')).map(s => parseInt(s.id.substring(1)) || 0);
        const maxId = numIds.length > 0 ? Math.max(...numIds) : 100;
        const newId = 's' + (maxId + 1);

        students.push({ id: newId, name, password });
        DB.setStudents(students);
        
        addStudentForm.reset();
        renderStudents();
        alert(`Successfully added ${name}. Logic ID assigned: ${newId}`);
    });

    addTeacherForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('teacherName').value.trim();
        const password = document.getElementById('teacherPassword').value.trim();
        const teachers = DB.getTeachers();
        
        // Generate chronological ID like t201
        const numIds = teachers.filter(t => t.id.startsWith('t')).map(t => parseInt(t.id.substring(1)) || 0);
        const maxId = numIds.length > 0 ? Math.max(...numIds) : 200;
        const newId = 't' + (maxId + 1);

        teachers.push({ id: newId, name, password });
        DB.setTeachers(teachers);
        
        addTeacherForm.reset();
        renderTeachers(); // Will also re-render the dropdown list!
        alert(`Successfully added ${name}. Logic ID assigned: ${newId}`);
    });

    addSalaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const teacherId = document.getElementById('salaryTeacherId').value;
        const month = document.getElementById('salaryMonth').value;
        const amount = parseFloat(document.getElementById('salaryAmount').value);

        if(!teacherId) return alert("Select a teacher first.");
        
        const salaries = DB.getSalaries();
        const newId = salaries.length > 0 ? Math.max(...salaries.map(s => s.id)) + 1 : 1;

        salaries.push({
            id: newId,
            teacherId,
            month,
            amount,
            dateIssued: new Date().toISOString().split('T')[0]
        });

        DB.setSalaries(salaries);
        addSalaryForm.reset();
        renderSalaries();
        alert(`Salary issued!`);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        DB.logout();
        window.location.href = 'index.html';
    });

    // Initial render
    renderStudents();
    renderTeachers();
    renderSalaries();
});
