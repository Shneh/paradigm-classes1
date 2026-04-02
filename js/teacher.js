document.addEventListener('DOMContentLoaded', () => {
    // Standard auth check
    const user = Auth.checkAuth('teacher');
    if (!user) return;

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

    // Render Data functions
    function renderSalaries() {
        const salariesTableBody = document.querySelector('#salariesTable tbody');
        if(!salariesTableBody) return;
        
        const salaries = DB.getSalaries().filter(s => s.teacherId === user.id);
        salariesTableBody.innerHTML = '';
        
        if (salaries.length === 0) {
            salariesTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No salary records found.</td></tr>';
            return;
        }

        salaries.forEach(salary => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${salary.month}</td>
                <td>${salary.dateIssued}</td>
                <td class="text-right" style="text-align: right; font-weight: 700; color: var(--primary-color);">₹${salary.amount.toLocaleString('en-IN')}</td>
            `;
            salariesTableBody.appendChild(tr);
        });
    }

    function renderTests() {
        const tests = DB.getTests();
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
                    <div style="font-size: 0.85rem; color: var(--text-light);">Max Marks: ${test.maxMarks} | Date: ${test.date}</div>
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
    }

    // Handlers
    window.removeTest = (testId) => {
        if(confirm('Are you sure you want to permanently delete this test and all its marks?')) {
            let tests = DB.getTests();
            tests = tests.filter(t => t.id !== testId);
            DB.setTests(tests);
            renderTests();
        }
    };

    window.openMarkEntry = (testId) => {
        const tests = DB.getTests();
        const test = tests.find(t => t.id === testId);
        if(!test) return;

        currentEditingTestId = testId;
        markEntrySubject.textContent = `Subject: ${test.subject} (Max: ${test.maxMarks})`;
        markEntryPanel.style.display = 'block';

        const students = DB.getStudents();
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

    window.publishTest = (testId) => {
        if(confirm('Are you sure you want to publish? Students will be able to see the results.')) {
            let tests = DB.getTests();
            const idx = tests.findIndex(t => t.id === testId);
            if(idx !== -1) {
                tests[idx].published = true;
                DB.setTests(tests);
                renderTests();
            }
        }
    };

    document.getElementById('closeMarkPanel').addEventListener('click', () => {
        markEntryPanel.style.display = 'none';
        currentEditingTestId = null;
    });

    // Form Submits

    addTestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const subject = document.getElementById('testSubject').value;
        const maxMarks = parseInt(document.getElementById('testMaxMarks').value);
        
        const tests = DB.getTests();
        const newId = tests.length > 0 ? Math.max(...tests.map(t => t.id)) + 1 : 1;
        
        tests.unshift({
            id: newId,
            subject,
            maxMarks,
            date: new Date().toISOString().split('T')[0],
            marks: [],
            published: false
        });
        
        DB.setTests(tests);
        addTestForm.reset();
        renderTests();
    });

    feedMarksForm.addEventListener('submit', (e) => {
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

        const tests = DB.getTests();
        const idx = tests.findIndex(t => t.id === currentEditingTestId);
        if(idx !== -1) {
            tests[idx].marks = newMarks;
            DB.setTests(tests);
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
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value.trim();
            if(!newPassword) return;

            let teachers = DB.getTeachers();
            let idx = teachers.findIndex(t => t.id === user.id);
            if(idx !== -1) {
                teachers[idx].password = newPassword;
                DB.setTeachers(teachers);
                alert("Password updated successfully! Please log in again.");
                DB.logout();
                window.location.href = 'login.html';
            }
        });
    }

    // Initial render
    renderSalaries();
    renderTests();
});
