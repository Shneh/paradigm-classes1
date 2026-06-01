document.addEventListener('DOMContentLoaded', async () => {
    // Standard auth check
    const user = Auth.checkAuth('admin');
    if (!user) return;

    // DOM Elements
    const studentsTableBody = document.querySelector('#studentsTable tbody');
    const alumniTableBody = document.querySelector('#alumniTable tbody');
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
    const addSalaryForm = document.getElementById('add-salary-form');
    const salaryTeacherIdSelect = document.getElementById('salaryTeacherId');
    
    // Course Management Elements
    const addCourseForm = document.getElementById('add-course-form');
    const coursesTableBody = document.querySelector('#coursesTable tbody');

    // Announcement Marquee Elements
    const updateAnnouncementForm = document.getElementById('update-announcement-form');
    const announcementTextInput = document.getElementById('announcementText');
    const announcementEnabledCheckbox = document.getElementById('announcementEnabled');

    const totalExpectedFeesEl = document.getElementById('totalExpectedFees');
    const totalActualCollectedEl = document.getElementById('totalActualCollected');
    const totalTeacherSalariesEl = document.getElementById('totalTeacherSalaries');
    const tuitionNetMarginEl = document.getElementById('tuitionNetMargin');

    // DOM Elements for dynamic splits and breakdowns
    const splitStudentIdSelect = document.getElementById('splitStudentId');
    const studentSplitsContainer = document.getElementById('studentSplitsContainer');
    const splitStudentTotalFeesEl = document.getElementById('splitStudentTotalFees');
    const splitStudentAssignedTotalEl = document.getElementById('splitStudentAssignedTotal');
    const saveAllSplitsForm = document.getElementById('save-all-splits-form');
    const studentSplitsInputsList = document.getElementById('studentSplitsInputsList');

    const breakdownTeacherIdSelect = document.getElementById('breakdownTeacherId');
    const teacherBreakdownContainer = document.getElementById('teacherBreakdownContainer');
    const teacherBreakdownTableBody = document.querySelector('#teacherBreakdownTable tbody');
    const teacherBreakdownTotalEl = document.getElementById('teacherBreakdownTotal');

    // Helper to calculate teacher dynamic salary
    function calculateTeacherDynamicSalary(teacherId, studentsList) {
        let total = 0;
        studentsList.forEach(student => {
            const splits = student.feeSplits || [];
            const split = splits.find(s => s.teacherId.toLowerCase() === teacherId.toLowerCase());
            if (split) {
                total += (student.fees || 0) * (split.percentage || 0) / 100;
            }
        });
        return total;
    }

    // Financial Overview Calculation
    async function calculateFinancials() {
        const students = await DB.getStudents();
        const alumni = await DB.getAlumni();
        const teachers = await DB.getTeachers();

        let totalExpected = 0;
        let totalCollected = 0;
        let totalTeacherPayout = 0;

        // Calculate expected monthly income & collected from active students
        students.forEach(student => {
            totalExpected += (student.fees || 0);
            const payments = student.feePayments || [];
            payments.forEach(payment => {
                totalCollected += (student.fees || 0) + (payment.finePaid || 0);
            });
        });

        // Calculate collected from alumni
        alumni.forEach(alumnus => {
            const payments = alumnus.feePayments || [];
            payments.forEach(payment => {
                totalCollected += (alumnus.fees || 0) + (payment.finePaid || 0);
            });
        });

        // Calculate dynamic teacher salaries
        teachers.forEach(teacher => {
            totalTeacherPayout += calculateTeacherDynamicSalary(teacher.id, students);
        });

        const netMargin = totalExpected - totalTeacherPayout;

        if (totalExpectedFeesEl) {
            totalExpectedFeesEl.textContent = `₹${totalExpected.toLocaleString('en-IN')}`;
        }
        if (totalActualCollectedEl) {
            totalActualCollectedEl.textContent = `₹${totalCollected.toLocaleString('en-IN')}`;
        }
        if (totalTeacherSalariesEl) {
            totalTeacherSalariesEl.textContent = `₹${totalTeacherPayout.toLocaleString('en-IN')}`;
        }
        if (tuitionNetMarginEl) {
            tuitionNetMarginEl.textContent = `₹${netMargin.toLocaleString('en-IN')}`;
        }
    }

    // Render Functions
    async function renderStudents() {
        const students = await DB.getStudents();
        const teachers = await DB.getTeachers();
        studentsTableBody.innerHTML = '';
        if(updateStudentIdSelect) updateStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
        if(feeStudentIdSelect) feeStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
        if(splitStudentIdSelect) splitStudentIdSelect.innerHTML = '<option value="" disabled selected>-- Select Student --</option>';
        
        students.forEach(student => {
            const splits = student.feeSplits || [];
            let splitsHtml = '<div style="font-size:0.85rem; line-height:1.4;">';
            if (splits.length === 0) {
                splitsHtml += '<span style="color:var(--text-light); font-style:italic;">None (0%)</span>';
            } else {
                splits.forEach(split => {
                    const teacher = teachers.find(t => t.id.toLowerCase() === split.teacherId.toLowerCase());
                    const teacherName = teacher ? teacher.name : 'Unknown';
                    const amount = (student.fees || 0) * split.percentage / 100;
                    splitsHtml += `<div style="margin-bottom:0.15rem;"><strong>${teacherName}</strong>: ${split.percentage}% (<span style="color:#166534; font-weight:600;">₹${amount.toLocaleString('en-IN')}</span>)</div>`;
                });
            }
            splitsHtml += '</div>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td><span class="badge" style="background:#e2e8f0; color:#475569;">${student.class || 'N/A'}</span></td>
                <td><div style="font-size:0.85rem; color:var(--text-light); line-height:1.4;">
                    M: ${student.motherPhone ? `<a href="tel:${student.motherPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Mother">📞 ${student.motherPhone}</a>` : 'N/A'}<br>
                    F: ${student.fatherPhone ? `<a href="tel:${student.fatherPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Father">📞 ${student.fatherPhone}</a>` : 'N/A'}<br>
                    P: ${student.personalPhone ? `<a href="tel:${student.personalPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Student">📞 ${student.personalPhone}</a>` : 'N/A'}
                </div></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="pwd-${student.id}" style="font-family: monospace; color: var(--primary-light); display: none;">${student.password}</span>
                        <span id="pwd-mask-${student.id}" style="font-family: monospace; color: var(--text-light);">••••••••</span>
                        <button type="button" class="btn btn-outline" style="padding: 0.2rem; font-size: 0; line-height: 0; border: none; background: transparent; color: var(--text-light); cursor: pointer;" onclick="toggleStudentPassword('${student.id}', this)" title="Toggle Visibility">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </td>
                <td>${splitsHtml}</td>
                <td>
                    <div class="action-buttons" style="display: flex; gap: 0.3rem;">
                        <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #1e3a8a; border-color: #1e3a8a; font-size: 0.8rem;" onclick="makeAlumni('${student.id}')" title="Move to Alumni">Alumni</button>
                        <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626; font-size: 0.8rem;" onclick="removeStudent('${student.id}')" title="Permanently Remove">Remove</button>
                    </div>
                </td>
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
            if(splitStudentIdSelect) {
                const opt = document.createElement('option');
                opt.value = student.id;
                opt.textContent = `${student.name} (${student.id})`;
                splitStudentIdSelect.appendChild(opt);
            }
        });
    }

    async function renderAlumni() {
        if (!alumniTableBody) return;
        const alumniList = await DB.getAlumni();
        alumniTableBody.innerHTML = '';
        
        // Sort by convertedOn date descending
        const sortedAlumni = [...alumniList].sort((a,b) => new Date(b.convertedOn || 0) - new Date(a.convertedOn || 0));

        if (sortedAlumni.length === 0) {
            alumniTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light);">No alumni records found.</td></tr>';
            return;
        }

        sortedAlumni.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td><span class="badge" style="background:#e2e8f0; color:#475569;">${student.class || 'N/A'}</span></td>
                <td><div style="font-size:0.85rem; color:var(--text-light); line-height:1.4;">
                    M: ${student.motherPhone ? `<a href="tel:${student.motherPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Mother">📞 ${student.motherPhone}</a>` : 'N/A'}<br>
                    F: ${student.fatherPhone ? `<a href="tel:${student.fatherPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Father">📞 ${student.fatherPhone}</a>` : 'N/A'}<br>
                    P: ${student.personalPhone ? `<a href="tel:${student.personalPhone}" style="color: var(--primary-light); text-decoration: none;" title="Call Student">📞 ${student.personalPhone}</a>` : 'N/A'}
                </div></td>
                <td>${DB.formatDate(student.convertedOn) || 'Unknown'}</td>
            `;
            alumniTableBody.appendChild(tr);
        });
    }

    async function renderCourses() {
        if (!coursesTableBody) return;
        let courses = await DB.getCourses();
        if (courses.length === 0) {
            // Seed default courses
            courses = [
                {
                    id: "course-ix-x",
                    title: "Class IX-X Foundation",
                    fees: 2000,
                    description: "Build a strong foundation in Physics, Chemistry, and Mathematics for board exams and future competitive preparations.",
                    features: ["RD Sharma-based curriculum", "Regular practice tests", "Board exam preparation"]
                },
                {
                    id: "course-xi-xii",
                    title: "Class XI-XII (PCM)",
                    fees: 3500,
                    description: "Comprehensive coaching for board exams with special focus on building concepts for competitive exams.",
                    features: ["Board + Competitive focus", "Advanced problem solving", "Regular mock tests"]
                },
                {
                    id: "course-jee",
                    title: "JEE (Main & Advanced)",
                    fees: 5000,
                    description: "Specialized coaching for JEE aspirants with focus on conceptual clarity and problem-solving skills.",
                    features: ["Topic-wise tests", "Previous year papers", "Full-length mock tests"]
                },
                {
                    id: "course-neet",
                    title: "NEET Preparation",
                    fees: 5000,
                    description: "Comprehensive coaching for NEET aspirants with focus on Physics and Chemistry.",
                    features: ["NCERT-focused approach", "Chapter-wise tests", "Regular doubt sessions"]
                },
                {
                    id: "course-nda",
                    title: "NDA Preparation",
                    fees: 4500,
                    description: "Specialized coaching for NDA aspirants with focus on Mathematics and General Ability Test.",
                    features: ["Mathematics mastery", "GAT preparation", "SSB interview guidance"]
                },
                {
                    id: "course-cuet",
                    title: "CUET Preparation",
                    fees: 3000,
                    description: "Comprehensive coaching for CUET with focus on domain subjects in Physics, Chemistry, and Mathematics.",
                    features: ["Domain subject focus", "General test prep", "Language test prep"]
                }
            ];
            await DB.setCourses(courses);
        }

        coursesTableBody.innerHTML = '';
        courses.forEach(course => {
            const tr = document.createElement('tr');
            
            // Format features list
            const featuresHtml = (course.features || []).map(f => `<span class="badge" style="background:#f1f5f9; color:#475569; margin: 0.15rem 0.15rem 0.15rem 0; display: inline-block;">${f}</span>`).join('');
            
            tr.innerHTML = `
                <td style="font-weight: 600; color: #1e3a8a;">${course.title}</td>
                <td class="text-right" style="text-align: right; font-weight: bold; color: #166534;">₹${(course.fees || 0).toLocaleString('en-IN')}</td>
                <td>
                    <div style="font-size:0.85rem; color:var(--text-light); margin-bottom:0.3rem;">${course.description || ''}</div>
                    <div>${featuresHtml}</div>
                </td>
                <td class="text-right" style="text-align: right;">
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626; font-size: 0.8rem;" onclick="removeCourse('${course.id}')" title="Delete Course">Delete</button>
                </td>
            `;
            coursesTableBody.appendChild(tr);
        });
    }

    // Expose removeCourse to window so HTML buttons can click it
    window.removeCourse = async (courseId) => {
        if (!confirm("Are you sure you want to delete this course and its fee structure?")) return;
        try {
            const courses = await DB.getCourses();
            const updated = courses.filter(c => c.id !== courseId);
            await DB.setCourses(updated);
            await renderCourses();
            alert("Course deleted successfully!");
        } catch (err) {
            console.error("Error deleting course:", err);
            alert("Error deleting course: " + err.message);
        }
    };

    async function renderTeachers() {
        const teachers = await DB.getTeachers();
        const students = await DB.getStudents();
        teachersTableBody.innerHTML = '';
        salaryTeacherIdSelect.innerHTML = '<option value="" disabled selected>-- Select Teacher --</option>';
        if (breakdownTeacherIdSelect) {
            breakdownTeacherIdSelect.innerHTML = '<option value="" disabled selected>-- Select Teacher --</option>';
        }

        teachers.forEach(teacher => {
            const dynamicSalary = calculateTeacherDynamicSalary(teacher.id, students);
            
            // Populate table
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${teacher.id}</td>
                <td>${teacher.name}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span id="tpwd-${teacher.id}" style="font-family: monospace; color: var(--primary-light); display: none;">${teacher.password}</span>
                        <span id="tpwd-mask-${teacher.id}" style="font-family: monospace; color: var(--text-light);">••••••••</span>
                        <button type="button" class="btn btn-outline" style="padding: 0.2rem; font-size: 0; line-height: 0; border: none; background: transparent; color: var(--text-light); cursor: pointer;" onclick="toggleTeacherPassword('${teacher.id}', this)" title="Toggle Visibility">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </td>
                <td style="font-weight: bold; color: #166534;">₹${dynamicSalary.toLocaleString('en-IN')}</td>
                <td><button class="btn btn-outline" style="padding: 0.2rem 0.5rem; color: #dc2626; border-color: #dc2626;" onclick="removeTeacher('${teacher.id}')">Remove</button></td>
            `;
            teachersTableBody.appendChild(tr);

            // Populate select dropdown for Salaries
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} (${teacher.id})`;
            salaryTeacherIdSelect.appendChild(option);
            
            if (breakdownTeacherIdSelect) {
                const opt2 = document.createElement('option');
                opt2.value = teacher.id;
                opt2.textContent = `${teacher.name} (${teacher.id})`;
                breakdownTeacherIdSelect.appendChild(opt2);
            }
        });
    }

    // Render student fee splits list as input fields for ALL teachers
    async function renderStudentFeeSplits(studentId) {
        if (!studentSplitsContainer) return;
        
        const students = await DB.getStudents();
        const student = students.find(s => s.id === studentId);
        if (!student) {
            studentSplitsContainer.style.display = 'none';
            return;
        }

        const teachers = await DB.getTeachers();

        studentSplitsContainer.style.display = 'block';
        splitStudentTotalFeesEl.textContent = `₹${(student.fees || 0).toLocaleString('en-IN')}`;

        const splits = student.feeSplits || [];
        const splitsInputsList = document.getElementById('studentSplitsInputsList');
        splitsInputsList.innerHTML = '';

        let totalAssigned = 0;

        if (teachers.length === 0) {
            splitsInputsList.innerHTML = '<div style="grid-column: 1/-1; color: var(--text-light); font-style: italic;">No teachers created yet.</div>';
        } else {
            teachers.forEach(teacher => {
                const split = splits.find(s => s.teacherId.toLowerCase() === teacher.id.toLowerCase());
                const currentVal = split ? split.percentage : 0;
                totalAssigned += currentVal;

                const div = document.createElement('div');
                div.className = 'form-group';
                div.style.margin = '0';
                div.innerHTML = `
                    <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-dark); margin-bottom: 0.25rem; display: block;">${teacher.name} (${teacher.id})</label>
                    <input type="number" class="form-input all-splits-percent-input" data-teacher-id="${teacher.id}" min="0" max="100" style="padding: 0.4rem; font-size: 0.9rem;" value="${currentVal}" oninput="updateLiveSplitsSum()">
                `;
                splitsInputsList.appendChild(div);
            });
        }

        splitStudentAssignedTotalEl.textContent = `${totalAssigned}%`;
        if (totalAssigned > 100) {
            splitStudentAssignedTotalEl.style.color = '#dc2626';
        } else {
            splitStudentAssignedTotalEl.style.color = '#166534';
        }
    }

    window.updateLiveSplitsSum = () => {
        const percentInputs = document.querySelectorAll('.all-splits-percent-input');
        let totalAssigned = 0;
        percentInputs.forEach(input => {
            totalAssigned += parseInt(input.value) || 0;
        });
        
        const splitStudentAssignedTotalEl = document.getElementById('splitStudentAssignedTotal');
        if (splitStudentAssignedTotalEl) {
            splitStudentAssignedTotalEl.textContent = `${totalAssigned}%`;
            if (totalAssigned > 100) {
                splitStudentAssignedTotalEl.style.color = '#dc2626';
            } else {
                splitStudentAssignedTotalEl.style.color = '#166534';
            }
        }
    };

    // Render dynamic salary breakdown for selected teacher
    async function renderTeacherBreakdown(teacherId) {
        if (!teacherBreakdownContainer) return;

        const students = await DB.getStudents();
        teacherBreakdownTableBody.innerHTML = '';

        let totalSalary = 0;
        let count = 0;

        students.forEach(student => {
            const splits = student.feeSplits || [];
            const split = splits.find(s => s.teacherId.toLowerCase() === teacherId.toLowerCase());
            if (split) {
                count++;
                const shareAmount = (student.fees || 0) * (split.percentage || 0) / 100;
                totalSalary += shareAmount;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${student.name} <span style="font-size:0.8rem; color:var(--text-light);">(${student.id})</span></td>
                    <td>₹${(student.fees || 0).toLocaleString('en-IN')}</td>
                    <td>${split.percentage}%</td>
                    <td style="text-align: right; font-weight: 600; color: #166534;">₹${shareAmount.toLocaleString('en-IN')}</td>
                `;
                teacherBreakdownTableBody.appendChild(tr);
            }
        });

        if (count === 0) {
            teacherBreakdownTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-light);">This teacher is not assigned to any student fee shares.</td></tr>';
            teacherBreakdownContainer.style.display = 'block';
        } else {
            teacherBreakdownContainer.style.display = 'block';
        }

        teacherBreakdownTotalEl.textContent = `₹${totalSalary.toLocaleString('en-IN')}`;
    }

    async function renderSalaries() {
        const salaries = await DB.getSalaries();
        const teachers = await DB.getTeachers();
        salariesTableBody.innerHTML = '';
        
        // Sort by newest first using ID
        const sortedSalaries = [...salaries].sort((a,b) => b.id - a.id);

        sortedSalaries.forEach(salary => {
            const teacher = teachers.find(t => t.id.toLowerCase() === salary.teacherId.toLowerCase());
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

    // Toggle Password Visibility
    const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    window.toggleStudentPassword = (id, btn) => {
        const p = document.getElementById(`pwd-${id}`);
        const m = document.getElementById(`pwd-mask-${id}`);
        if(p.style.display === 'none') {
            p.style.display = 'inline';
            m.style.display = 'none';
            btn.innerHTML = eyeOffIcon;
        } else {
            p.style.display = 'none';
            m.style.display = 'inline';
            btn.innerHTML = eyeIcon;
        }
    };

    window.toggleTeacherPassword = function(id, btn) {
        const pwdSpan = document.getElementById(`tpwd-${id}`);
        const maskSpan = document.getElementById(`tpwd-mask-${id}`);
        if(pwdSpan.style.display === 'none') {
            pwdSpan.style.display = 'inline';
            maskSpan.style.display = 'none';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            pwdSpan.style.display = 'none';
            maskSpan.style.display = 'inline';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
    };

    // Convert to Alumni Logic
    window.makeAlumni = async (id) => {
        if(confirm(`Are you sure you want to convert student ${id} to Alumni? This will move their data out of active students.`)) {
            let students = await DB.getStudents();
            const studentIdx = students.findIndex(s => s.id === id);
            
            if (studentIdx !== -1) {
                const studentData = students[studentIdx];
                
                // Add to alumni
                let alumniList = await DB.getAlumni();
                alumniList.push({
                    ...studentData,
                    convertedOn: new Date().toISOString().split('T')[0]
                });
                await DB.setAlumni(alumniList);
                
                // Remove from active students
                students.splice(studentIdx, 1);
                await DB.setStudents(students);
                
                // Refresh UI
                renderStudents();
                renderAlumni();
                await calculateFinancials();
                alert(`Student ${id} has been successfully moved to the Alumni database!`);
            }
        }
    };

    // Removal Logic
    window.removeStudent = async (id) => {
        if(confirm(`Are you sure you want to completely remove student ${id}?`)) {
            let students = await DB.getStudents();
            students = students.filter(s => s.id !== id);
            await DB.setStudents(students);
            renderStudents();
            await calculateFinancials();
        }
    };

    window.removeTeacher = async (id) => {
        if(confirm(`Are you sure you want to completely remove teacher ${id}?`)) {
            let teachers = await DB.getTeachers();
            teachers = teachers.filter(t => t.id !== id);
            await DB.setTeachers(teachers);
            renderTeachers();
            await calculateFinancials();
            
            // Refresh breakdown if active
            if (breakdownTeacherIdSelect && breakdownTeacherIdSelect.value === id) {
                renderTeacherBreakdown('');
            }
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
        const motherPhone = document.getElementById('studentMotherPhone').value.trim();
        const fatherPhone = document.getElementById('studentFatherPhone').value.trim();
        const personalPhone = document.getElementById('studentPersonalPhone').value.trim();
        
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
            feePayments: [],
            motherPhone,
            fatherPhone,
            personalPhone,
            feeSplits: []
        });
        await DB.setStudents(students);
        
        addStudentForm.reset();
        renderStudents();
        await calculateFinancials();
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

    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('courseTitle').value.trim();
            const fees = parseInt(document.getElementById('courseFees').value) || 0;
            const description = document.getElementById('courseDescription').value.trim();
            const featuresInput = document.getElementById('courseFeatures').value.trim();

            if (!title || !description || !featuresInput) {
                return alert("All fields are required.");
            }

            const features = featuresInput.split(',').map(f => f.trim()).filter(f => f.length > 0);
            
            try {
                const courses = await DB.getCourses();
                const newCourse = {
                    id: "course-" + Date.now().toString(36),
                    title,
                    fees,
                    description,
                    features
                };
                courses.push(newCourse);
                await DB.setCourses(courses);
                
                addCourseForm.reset();
                await renderCourses();
                alert(`Successfully added course: ${title}!`);
            } catch (err) {
                console.error("Error adding course:", err);
                alert("Error adding course: " + err.message);
            }
        });
    }

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
        await calculateFinancials();
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
                document.getElementById('updateStudentMotherPhone').value = student.motherPhone || '';
                document.getElementById('updateStudentFatherPhone').value = student.fatherPhone || '';
                document.getElementById('updateStudentPersonalPhone').value = student.personalPhone || '';
                
                // Load teacher splits dynamically
                const teachers = await DB.getTeachers();
                const splitsWrapper = document.getElementById('updateStudentSplitsWrapper');
                const splitsList = document.getElementById('updateStudentSplitsList');
                
                if (splitsWrapper && splitsList) {
                    splitsList.innerHTML = '';
                    if (teachers.length === 0) {
                        splitsList.innerHTML = '<div style="grid-column: 1/-1; color: var(--text-light); font-style: italic;">No teachers created yet.</div>';
                    } else {
                        teachers.forEach(teacher => {
                            const split = (student.feeSplits || []).find(s => s.teacherId.toLowerCase() === teacher.id.toLowerCase());
                            const currentVal = split ? split.percentage : 0;
                            
                            const div = document.createElement('div');
                            div.className = 'form-group';
                            div.style.margin = '0';
                            div.innerHTML = `
                                <label style="font-weight: 500; font-size: 0.85rem; color: var(--text-dark); margin-bottom: 0.25rem; display: block;">${teacher.name} (${teacher.id})</label>
                                <input type="number" class="form-input update-split-percent-input" data-teacher-id="${teacher.id}" min="0" max="100" style="padding: 0.4rem; font-size: 0.9rem;" value="${currentVal}">
                            `;
                            splitsList.appendChild(div);
                        });
                    }
                    splitsWrapper.style.display = 'block';
                }
            } else {
                const splitsWrapper = document.getElementById('updateStudentSplitsWrapper');
                if (splitsWrapper) splitsWrapper.style.display = 'none';
            }
        });

        updateStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentId = updateStudentIdSelect.value;
            if(!studentId) return alert('Select student');
            
            const percentInputs = document.querySelectorAll('.update-split-percent-input');
            let newFeeSplits = [];
            let totalPercentage = 0;
            
            percentInputs.forEach(input => {
                const percentage = parseInt(input.value) || 0;
                const teacherId = input.dataset.teacherId;
                if (percentage > 0) {
                    newFeeSplits.push({ teacherId, percentage });
                    totalPercentage += percentage;
                }
            });

            if (totalPercentage > 100) {
                return alert(`Cannot update profile. Total fee share percentage among teachers (${totalPercentage}%) cannot exceed 100%.`);
            }

            const students = await DB.getStudents();
            const idx = students.findIndex(s => s.id === studentId);
            if (idx !== -1) {
                students[idx].dateOfJoining = updateStudentDojInput.value;
                students[idx].fees = parseFloat(updateStudentFeesInput.value) || 0;
                students[idx].motherPhone = document.getElementById('updateStudentMotherPhone').value.trim();
                students[idx].fatherPhone = document.getElementById('updateStudentFatherPhone').value.trim();
                students[idx].personalPhone = document.getElementById('updateStudentPersonalPhone').value.trim();
                students[idx].feeSplits = newFeeSplits; // update the splits

                if(!students[idx].feePayments) students[idx].feePayments = [];
                await DB.setStudents(students);
                alert('Student profile updated successfully!');
                await calculateFinancials();
                if (feeStudentIdSelect && feeStudentIdSelect.value === studentId) {
                    renderFeeCycles(studentId);
                }
                if (splitStudentIdSelect && splitStudentIdSelect.value === studentId) {
                    renderStudentFeeSplits(studentId);
                }
                renderStudents();
                renderTeachers();
                if (breakdownTeacherIdSelect && breakdownTeacherIdSelect.value) {
                    renderTeacherBreakdown(breakdownTeacherIdSelect.value);
                }
            }
        });
    }

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
            markedBy: 'Admin'
        });

        await DB.setStudents(students);
        await calculateFinancials();
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

    // Dynamic fee splits and breakdown listeners
    if (splitStudentIdSelect) {
        splitStudentIdSelect.addEventListener('change', (e) => {
            renderStudentFeeSplits(e.target.value);
        });
    }

    if (saveAllSplitsForm) {
        saveAllSplitsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const studentId = splitStudentIdSelect.value;
            if (!studentId) return alert("Select student first.");

            const percentInputs = document.querySelectorAll('.all-splits-percent-input');
            let newFeeSplits = [];
            let totalPercentage = 0;

            percentInputs.forEach(input => {
                const percentage = parseInt(input.value) || 0;
                const teacherId = input.dataset.teacherId;
                if (percentage > 0) {
                    newFeeSplits.push({ teacherId, percentage });
                    totalPercentage += percentage;
                }
            });

            if (totalPercentage > 100) {
                return alert(`Cannot save splits. Total fee share percentage among teachers (${totalPercentage}%) cannot exceed 100%.`);
            }

            const students = await DB.getStudents();
            const idx = students.findIndex(s => s.id === studentId);
            if (idx !== -1) {
                students[idx].feeSplits = newFeeSplits;
                await DB.setStudents(students);
                
                await renderStudentFeeSplits(studentId);
                await renderStudents();
                await renderTeachers();
                await calculateFinancials();

                // Refresh breakdown if active
                if (breakdownTeacherIdSelect && breakdownTeacherIdSelect.value) {
                    renderTeacherBreakdown(breakdownTeacherIdSelect.value);
                }

                alert("Fee share splits successfully updated in a single go!");
            }
        });
    }

    if (breakdownTeacherIdSelect) {
        breakdownTeacherIdSelect.addEventListener('change', (e) => {
            renderTeacherBreakdown(e.target.value);
        });
    }

    if (salaryTeacherIdSelect) {
        salaryTeacherIdSelect.addEventListener('change', async (e) => {
            const teacherId = e.target.value;
            const students = await DB.getStudents();
            const dynamicSalary = calculateTeacherDynamicSalary(teacherId, students);
            const salaryAmountInput = document.getElementById('salaryAmount');
            if (salaryAmountInput) {
                salaryAmountInput.value = dynamicSalary;
            }
        });
    }

    // Load and manage Tuition Announcement & Alert
    if (updateAnnouncementForm) {
        // Pre-fill the announcement inputs
        const currentAnn = await DB.getAnnouncement();
        if (announcementTextInput) announcementTextInput.value = currentAnn.text || '';
        if (announcementEnabledCheckbox) announcementEnabledCheckbox.checked = !!currentAnn.enabled;

        updateAnnouncementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = announcementTextInput.value.trim();
            const enabled = announcementEnabledCheckbox.checked;

            if (text === '') {
                return alert("Announcement text cannot be empty.");
            }

            try {
                await DB.setAnnouncement({ text, enabled });
                alert("Tuition announcement successfully updated! Refresh to see the changes.");
                
                // Instantly update marquee locally on current page
                const existingBanner = document.querySelector('.pc-marquee-banner');
                if (existingBanner) existingBanner.remove();
                document.body.classList.remove('has-marquee');
                
                if (enabled) {
                    if (typeof initAnnouncementBanner === 'function') {
                        await initAnnouncementBanner();
                    }
                }
            } catch (err) {
                console.error("Error updating announcement:", err);
                alert("Error updating announcement: " + err.message);
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
    await renderAlumni();
    await renderTeachers();
    await renderSalaries();
    await renderCourses();
    await calculateFinancials();
});
