async function initAdminDashboard() {
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

    // === Premium SPA Tab Toggling & Sidebar Layout Controller ===
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const activeTabTitle = document.getElementById('activeTabTitle');
    const menuToggleBtn = document.getElementById('menuToggleBtn');
    const adminSidebar = document.getElementById('adminSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Populate admin ID in topbar badge
    const adminUserSpan = document.querySelector('.user-badge span');
    if (adminUserSpan && user) {
        adminUserSpan.textContent = user.id || 'Admin';
    }

    function switchTab(tabId) {
        let activeItem = null;
        menuItems.forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
                activeItem = item;
            } else {
                item.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === `tab-${tabId}`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });

        if (activeTabTitle && activeItem) {
            // Get content text ignoring nested svg node
            const titleNode = Array.from(activeItem.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            activeTabTitle.textContent = titleNode ? titleNode.textContent.trim() : activeItem.textContent.trim();
        }

        sessionStorage.setItem('adminActiveTab', tabId);
    }

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.dataset.tab;
            switchTab(tabId);

            if (adminSidebar.classList.contains('open')) {
                adminSidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
            }
        });
    });

    if (menuToggleBtn && adminSidebar && sidebarOverlay) {
        menuToggleBtn.addEventListener('click', () => {
            adminSidebar.classList.toggle('open');
            sidebarOverlay.classList.toggle('show');
        });

        sidebarOverlay.addEventListener('click', () => {
            adminSidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
        });
    }

    const cachedTab = sessionStorage.getItem('adminActiveTab') || 'attendance';
    switchTab(cachedTab);

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

            let totalUnpaidBalance = 0;
            if (student.feePayments && Array.isArray(student.feePayments)) {
                student.feePayments.forEach(p => {
                    if (p.balance !== undefined) {
                        totalUnpaidBalance += (p.balance || 0);
                    }
                });
            }
            const studentBal = student.balance !== undefined ? student.balance : totalUnpaidBalance;
            const balColor = studentBal > 0 ? '#b91c1c' : '#166534';

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
                <td><strong style="color: ${balColor};">₹${studentBal.toLocaleString('en-IN')}</strong></td>
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
        });
        await renderPermissionsTable();
    }

    async function renderPermissionsTable() {
        const tableBody = document.querySelector('#lecturePermissionsTable tbody');
        const thead = document.querySelector('#lecturePermissionsTable thead');
        if (!tableBody || !thead) return;

        const students = await DB.getStudents();
        const lectures = await DB.getVideoLectures();

        // Dynamically build the permission headers
        let headersHTML = `
            <tr>
                <th style="text-align: left; padding: 0.5rem;">ID</th>
                <th style="text-align: left; padding: 0.5rem;">Student Name</th>
        `;
        lectures.forEach(scroller => {
            headersHTML += `
                <th style="text-align: center; padding: 0.5rem; font-size: 0.8rem; line-height: 1.2;">
                    ${scroller.title}<br><small style="color:var(--text-light);">${scroller.id}</small>
                </th>
            `;
        });
        headersHTML += `</tr>`;
        thead.innerHTML = headersHTML;

        tableBody.innerHTML = '';
        if (students.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${2 + lectures.length}" style="text-align: center; color: var(--text-light);">No active students.</td></tr>`;
            return;
        }

        students.forEach(student => {
            const tr = document.createElement('tr');
            
            let cellsHTML = `
                <td><strong>${student.id}</strong></td>
                <td><strong>${student.name}</strong></td>
            `;

            lectures.forEach(scroller => {
                const hasPermission = student.lecturePermissions && student.lecturePermissions.includes(scroller.id);
                cellsHTML += `
                    <td style="text-align: center;">
                        <input type="checkbox" 
                                class="student-course-checkbox" 
                                data-student-id="${student.id}" 
                                data-course-id="${scroller.id}" 
                                ${hasPermission ? 'checked' : ''} 
                                style="width: 18px; height: 18px; cursor: pointer;">
                    </td>
                `;
            });

            tr.innerHTML = cellsHTML;
            tableBody.appendChild(tr);
        });

        // Add event listeners to checkboxes for auto-saving
        tableBody.querySelectorAll('.student-course-checkbox').forEach(cb => {
            cb.addEventListener('change', async (e) => {
                const checkbox = e.target;
                const studentId = checkbox.dataset.studentId;
                const courseId = checkbox.dataset.courseId;
                const checked = checkbox.checked;

                try {
                    const studentsList = await DB.getStudents();
                    const studentIdx = studentsList.findIndex(s => s.id === studentId);
                    if (studentIdx !== -1) {
                        if (!studentsList[studentIdx].lecturePermissions) {
                            studentsList[studentIdx].lecturePermissions = [];
                        }
                        if (checked) {
                            if (!studentsList[studentIdx].lecturePermissions.includes(courseId)) {
                                studentsList[studentIdx].lecturePermissions.push(courseId);
                            }
                        } else {
                            studentsList[studentIdx].lecturePermissions = studentsList[studentIdx].lecturePermissions.filter(id => id !== courseId);
                        }
                        await DB.setStudents(studentsList);
                    }
                } catch (err) {
                    console.error("Error updating permissions:", err);
                    alert("Error saving permission: " + err.message);
                }
            });
        });
        await renderBatchProgress();
    }

    async function renderBatchProgress() {
        const tableBody = document.querySelector('#batchProgressTable tbody');
        const filterSelect = document.getElementById('batchProgressFilter');
        if (!tableBody || !filterSelect) return;

        const students = await DB.getStudents();
        const lectures = await DB.getVideoLectures();

        const classes = [...new Set(students.map(s => s.class).filter(Boolean))].sort();
        
        const currentFilterVal = filterSelect.value || 'all';
        filterSelect.innerHTML = '<option value="all">All Classes</option>';
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = `Class ${c}`;
            filterSelect.appendChild(opt);
        });
        filterSelect.value = currentFilterVal;

        const selectedClass = filterSelect.value;
        const filteredStudents = selectedClass === 'all' 
            ? students 
            : students.filter(s => s.class === selectedClass);

        tableBody.innerHTML = '';
        if (filteredStudents.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-light); padding: 2rem;">No active students found in this filter.</td></tr>`;
            return;
        }

        filteredStudents.forEach(student => {
            const permissions = student.lecturePermissions || [];
            const accessibleSections = lectures.filter(l => permissions.includes(l.id));

            let totalVideos = 0;
            let completedVideos = 0;
            const completedSet = new Set(student.completedLectures || []);

            accessibleSections.forEach(section => {
                const videos = section.videos || [];
                videos.forEach(video => {
                    totalVideos++;
                    const videoKey = `${section.id}::${video.title}`;
                    if (completedSet.has(videoKey)) {
                        completedVideos++;
                    }
                });
            });

            const overallPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
            const sectionTitles = accessibleSections.map(s => s.title).join(', ') || 'None';

            const tr = document.createElement('tr');
            tr.id = `row-progress-${student.id}`;
            tr.innerHTML = `
                <td><strong>${student.id}</strong></td>
                <td>${student.name}</td>
                <td><span class="badge" style="background:#e2e8f0; color:#475569; font-weight:700;">${student.class || 'N/A'}</span></td>
                <td>
                    <div style="font-size:0.85rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-light);" title="${sectionTitles}">
                        ${sectionTitles}
                    </div>
                </td>
                <td style="font-weight: 700;">${completedVideos} / ${totalVideos}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                        <div style="flex-grow: 1; background-color: var(--gray-200); height: 8px; border-radius: 4px; overflow: hidden; position: relative;">
                            <div style="width: ${overallPercent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #1e3a8a); border-radius: 4px;"></div>
                        </div>
                        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-dark); min-width: 35px; text-align: right;">${overallPercent}%</span>
                    </div>
                </td>
                <td style="text-align: right;">
                    <button class="btn btn-outline btn-details-toggle" 
                            style="padding: 0.2rem 0.5rem; color: #1e3a8a; border-color: #1e3a8a; font-size: 0.8rem;" 
                            data-student-id="${student.id}">
                        View Details
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);

            const detailsTr = document.createElement('tr');
            detailsTr.id = `details-${student.id}`;
            detailsTr.className = 'details-row';
            detailsTr.style.display = 'none';
            detailsTr.style.background = '#f8fafc';

            let detailsHtml = '';
            if (accessibleSections.length === 0) {
                detailsHtml = `<p style="color: var(--text-light); font-style: italic; margin: 0;">No accessible lectures assigned to this student.</p>`;
            } else {
                detailsHtml = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 0.5rem;">
                `;
                accessibleSections.forEach(section => {
                    const videos = section.videos || [];
                    let secCompleted = 0;
                    const itemsList = videos.map(video => {
                        const videoKey = `${section.id}::${video.title}`;
                        const isDone = completedSet.has(videoKey);
                        if (isDone) secCompleted++;
                        
                        const statusBadge = isDone 
                            ? `<span style="display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; background:#dcfce7; color:#166534; border-radius:50%; font-size:10px; font-weight:bold; margin-right:6px;">✓</span>`
                            : `<span style="display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; background:#e2e8f0; color:#64748b; border-radius:50%; font-size:10px; font-weight:bold; margin-right:6px;">○</span>`;
                        
                        return `<li style="list-style: none; margin-bottom: 0.35rem; font-size: 0.85rem; color: ${isDone ? 'var(--text-light)' : 'var(--text-dark)'}; ${isDone ? 'text-decoration: line-through;' : ''}">
                            ${statusBadge} ${video.title}
                        </li>`;
                    }).join('') || `<li style="list-style: none; color: var(--text-light); font-style: italic;">No videos added</li>`;

                    detailsHtml += `
                        <div style="background: white; border: 1px solid var(--gray-200); border-radius: var(--radius-md); padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                            <h4 style="margin-top: 0; margin-bottom: 0.75rem; color: var(--primary-color); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--gray-100); padding-bottom: 0.5rem; font-size: 0.95rem;">
                                <span>${section.title}</span>
                                <span style="font-size: 0.8rem; background: rgba(30,58,138,0.06); padding: 0.1rem 0.5rem; border-radius: 99px;">${secCompleted}/${videos.length}</span>
                            </h4>
                            <ul style="padding-left: 0; margin: 0;">
                                ${itemsList}
                            </ul>
                        </div>
                    `;
                });
                detailsHtml += `</div>`;
            }

            detailsTr.innerHTML = `
                <td colspan="7" style="padding: 1.5rem 2rem; border-bottom: 2px solid var(--gray-200);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 700;">Lecture Completion Status for ${student.name}</h3>
                        <span style="font-size:0.85rem; color: var(--text-light); font-weight: 600;">Overall: ${completedVideos} / ${totalVideos} Videos (${overallPercent}%)</span>
                    </div>
                    ${detailsHtml}
                </td>
            `;

            tableBody.appendChild(detailsTr);
        });

        tableBody.querySelectorAll('.btn-details-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sId = btn.dataset.studentId;
                const detailRow = document.getElementById(`details-${sId}`);
                if (detailRow) {
                    const isVisible = detailRow.style.display !== 'none';
                    if (isVisible) {
                        detailRow.style.display = 'none';
                        btn.textContent = 'View Details';
                        btn.style.background = 'transparent';
                        btn.style.color = '#1e3a8a';
                    } else {
                        detailRow.style.display = 'table-row';
                        btn.textContent = 'Hide Details';
                        btn.style.background = '#1e3a8a';
                        btn.style.color = 'white';
                    }
                }
            });
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
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: bold; color: #166534;">
                        <span id="tsal-${teacher.id}" style="display: none;">₹${dynamicSalary.toLocaleString('en-IN')}</span>
                        <span id="tsal-mask-${teacher.id}">₹••••••</span>
                        <button type="button" class="btn btn-outline" style="padding: 0.2rem; font-size: 0; line-height: 0; border: none; background: transparent; color: var(--text-light); cursor: pointer;" onclick="toggleTeacherSalary('${teacher.id}', this)" title="Toggle Visibility">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                    </div>
                </td>
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

    window.toggleTeacherSalary = function(id, btn) {
        const salSpan = document.getElementById(`tsal-${id}`);
        const maskSpan = document.getElementById(`tsal-mask-${id}`);
        if(salSpan.style.display === 'none') {
            salSpan.style.display = 'inline';
            maskSpan.style.display = 'none';
            btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            salSpan.style.display = 'none';
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

    window.markFeePaid = async (studentId, cycleStart, payDate, totalPayableInput, feePaidInput) => {
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

        const defaultPayable = (student.fees || 0) + fineLock;
        const parsedPayable = totalPayableInput !== undefined && totalPayableInput !== '' ? parseFloat(totalPayableInput) : defaultPayable;
        const totalPayableFee = isNaN(parsedPayable) ? defaultPayable : parsedPayable;

        const parsedFeePaid = feePaidInput !== undefined && feePaidInput !== '' ? parseFloat(feePaidInput) : totalPayableFee;
        const feePaid = isNaN(parsedFeePaid) ? totalPayableFee : parsedFeePaid;

        const balance = totalPayableFee - feePaid;

        const existingRecordIdx = student.feePayments.findIndex(p => p.cycleStart === cycleStart);
        const newRecord = {
            cycleStart,
            totalPayableFee,
            feePaid,
            balance,
            finePaid: fineLock,
            paidOn: paymentDateStr,
            markedBy: 'Admin'
        };

        if (existingRecordIdx !== -1) {
            student.feePayments[existingRecordIdx] = newRecord;
        } else {
            student.feePayments.push(newRecord);
        }

        // Recalculate student balance across all payments
        let totalBal = 0;
        let totalPayableSum = 0;
        let totalPaidSum = 0;
        student.feePayments.forEach(p => {
            const pPayable = p.totalPayableFee !== undefined ? p.totalPayableFee : ((student.fees || 0) + (p.finePaid || 0));
            const pPaid = p.feePaid !== undefined ? p.feePaid : pPayable;
            const pBal = p.balance !== undefined ? p.balance : (pPayable - pPaid);
            totalPayableSum += pPayable;
            totalPaidSum += pPaid;
            totalBal += pBal;
        });
        student.totalPayableFee = totalPayableSum;
        student.feePaid = totalPaidSum;
        student.balance = totalBal;

        // Distribute feePaid to assigned teachers' salary payouts based on percentage split
        const splits = student.feeSplits || [];
        if (splits.length > 0 && feePaid > 0) {
            const salaries = await DB.getSalaries();
            const payMonthStr = paymentDateStr.substring(0, 7);

            splits.forEach(split => {
                const percentage = split.percentage || 0;
                if (percentage > 0) {
                    const shareAmount = Math.round((feePaid * percentage) / 100);
                    if (shareAmount > 0) {
                        const maxSalaryId = salaries.length > 0 ? Math.max(...salaries.map(s => s.id || 0)) : 0;
                        salaries.push({
                            id: maxSalaryId + 1,
                            teacherId: split.teacherId,
                            month: payMonthStr,
                            amount: shareAmount,
                            dateIssued: paymentDateStr,
                            note: `Fee share (${percentage}%) from student ${student.name} (${student.id})`
                        });
                    }
                }
            });

            await DB.setSalaries(salaries);
            renderSalaries();
        }

        await DB.setStudents(students);
        await calculateFinancials();
        renderFeeCycles(studentId);
        renderStudents();
        renderTeachers();
        alert('Fees marked as paid and teacher salary payouts distributed successfully.');
    };

    async function renderFeeCycles(studentId) {
        if(!feeCyclesTableBody) return;
        feeCyclesTableBody.innerHTML = '';
        const students = await DB.getStudents();
        const student = students.find(s => s.id === studentId);
        if(!student || !student.dateOfJoining) {
            feeCyclesTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No valid Date of Joining found! Please update student profile.</td></tr>';
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
                const totalPayableFee = paymentRecord.totalPayableFee !== undefined ? paymentRecord.totalPayableFee : (baseFees + (paymentRecord.finePaid || 0));
                const feePaid = paymentRecord.feePaid !== undefined ? paymentRecord.feePaid : totalPayableFee;
                const balance = paymentRecord.balance !== undefined ? paymentRecord.balance : (totalPayableFee - feePaid);
                const balColor = balance > 0 ? '#b91c1c' : '#166534';
                const statusBadge = balance > 0 ? `<span class="badge badge-warning" style="background:#fef08a;color:#854d0e;">Paid w/ Bal</span>` : `<span class="badge badge-success" style="background:#dcfce7;color:#166534;">Paid</span>`;

                rowHtml += `
                    <td class="text-right">₹${totalPayableFee.toLocaleString('en-IN')} <br><small style="color:var(--text-light);">(Fine: ₹${paymentRecord.finePaid || 0})</small></td>
                    <td class="text-right" style="font-weight: 700; color: #166534;">₹${feePaid.toLocaleString('en-IN')}</td>
                    <td class="text-right" style="font-weight: 700; color: ${balColor};">₹${balance.toLocaleString('en-IN')}</td>
                    <td>${statusBadge}<br><small>by ${paymentRecord.markedBy}</small><br><small>on ${DB.formatDate(paymentRecord.paidOn)}</small></td>
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
                    <td class="text-right">
                        <input type="number" id="totalPayable-${startStr}" class="form-input" style="padding: 0.25rem 0.4rem; font-size: 0.85rem; text-align: right; width: 95px; display: inline-block;" value="${totalDue}" oninput="if(document.getElementById('feePaid-${startStr}') && !document.getElementById('feePaid-${startStr}').dataset.userModified){ document.getElementById('feePaid-${startStr}').value = this.value; } const tp=parseFloat(this.value)||0; const fp=parseFloat(document.getElementById('feePaid-${startStr}')?.value)||0; const b=document.getElementById('balDisplay-${startStr}'); if(b){ b.textContent='₹'+(tp-fp).toLocaleString('en-IN'); b.style.color=(tp-fp)>0?'#b91c1c':'#166534'; }">
                        <br><small style="color:var(--text-light);">(Fine: ₹${currentFine})</small>
                    </td>
                    <td class="text-right">
                        <input type="number" id="feePaid-${startStr}" class="form-input" style="padding: 0.25rem 0.4rem; font-size: 0.85rem; text-align: right; width: 95px; display: inline-block;" value="${totalDue}" oninput="this.dataset.userModified='true'; const tp=parseFloat(document.getElementById('totalPayable-${startStr}')?.value)||0; const fp=parseFloat(this.value)||0; const b=document.getElementById('balDisplay-${startStr}'); if(b){ b.textContent='₹'+(tp-fp).toLocaleString('en-IN'); b.style.color=(tp-fp)>0?'#b91c1c':'#166534'; }">
                    </td>
                    <td class="text-right" style="font-weight: 700; color: #166534;" id="balDisplay-${startStr}">₹0</td>
                    <td><span class="badge badge-warning" style="background:#fef08a;color:#854d0e;">Unpaid</span></td>
                    <td style="display: flex; flex-direction: column; gap: 0.3rem;">
                        <input type="date" id="payDate-${startStr}" class="form-input" style="padding: 0.2rem; font-size: 0.85rem;" value="${today.toISOString().split('T')[0]}">
                        <button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.85rem; background:#b91c1c; border-color:#b91c1c;" onclick="markFeePaid('${student.id}', '${startStr}', document.getElementById('payDate-${startStr}').value, document.getElementById('totalPayable-${startStr}').value, document.getElementById('feePaid-${startStr}').value)">Mark Paid</button>
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

    // === Video Lectures Management ===
    const createScrollerForm = document.getElementById('create-scroller-form');
    const newScrollerTitleInput = document.getElementById('newScrollerTitle');
    const scrollersListTableBody = document.querySelector('#scrollersListTable tbody');
    const manageVideoScrollerSelect = document.getElementById('manageVideoScrollerSelect');
    const addVideoForm = document.getElementById('add-video-form');
    const addVideoFormTitle = document.getElementById('addVideoFormTitle');
    const scrollerVideosListContainer = document.getElementById('scrollerVideosListContainer');
    const scrollerVideosTableBody = document.querySelector('#scrollerVideosTable tbody');
    const scrollerVideosPlaceholder = document.getElementById('scrollerVideosPlaceholder');

    async function renderScrollersList() {
        if (!scrollersListTableBody) return;
        const lectures = await DB.getVideoLectures();
        scrollersListTableBody.innerHTML = '';
        
        // Save current selection to restore after render
        const selectedId = manageVideoScrollerSelect.value;
        manageVideoScrollerSelect.innerHTML = '<option value="" disabled selected>-- Select a Scroller --</option>';

        if (lectures.length === 0) {
            scrollersListTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No scrollers created yet.</td></tr>';
            return;
        }

        lectures.forEach(scroller => {
            // Dropdown select option
            const opt = document.createElement('option');
            opt.value = scroller.id;
            opt.textContent = `${scroller.title} (${scroller.id})`;
            manageVideoScrollerSelect.appendChild(opt);

            // Table row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${scroller.id}</strong></td>
                <td>${scroller.title}</td>
                <td style="text-align: right; display: flex; gap: 0.3rem; justify-content: flex-end;">
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="editScrollerTitle('${scroller.id}')">Edit</button>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #dc2626; border-color: #dc2626;" onclick="deleteScroller('${scroller.id}')">Delete</button>
                </td>
            `;
            scrollersListTableBody.appendChild(tr);
        });

        // Restore dropdown selection if still exists
        if (selectedId && lectures.some(l => l.id === selectedId)) {
            manageVideoScrollerSelect.value = selectedId;
            showScrollerVideos(selectedId);
        } else {
            addVideoForm.style.display = 'none';
            scrollerVideosListContainer.style.display = 'none';
            scrollerVideosPlaceholder.style.display = 'block';
        }
    }

    window.editScrollerTitle = async (scrollerId) => {
        const lectures = await DB.getVideoLectures();
        const scroller = lectures.find(l => l.id === scrollerId);
        if (!scroller) return;

        const newTitle = prompt("Enter new title for scroller:", scroller.title);
        if (newTitle === null) return;
        const trimmed = newTitle.trim();
        if (trimmed === '') return alert("Title cannot be empty.");

        scroller.title = trimmed;
        await DB.setVideoLectures(lectures);
        alert("Scroller title updated successfully!");
        await renderScrollersList();
        await renderPermissionsTable(); // Permissions header must update
    };

    window.deleteScroller = async (scrollerId) => {
        if (!confirm(`Are you sure you want to delete this scroller? All video lectures in it will be permanently deleted.`)) return;

        try {
            let lectures = await DB.getVideoLectures();
            lectures = lectures.filter(l => l.id !== scrollerId);
            await DB.setVideoLectures(lectures);

            // Also clean up permissions for active students
            const students = await DB.getStudents();
            let updatedPermissions = false;
            students.forEach(student => {
                if (student.lecturePermissions && student.lecturePermissions.includes(scrollerId)) {
                    student.lecturePermissions = student.lecturePermissions.filter(id => id !== scrollerId);
                    updatedPermissions = true;
                }
            });
            if (updatedPermissions) {
                await DB.setStudents(students);
            }

            alert("Scroller deleted successfully!");
            await renderScrollersList();
            await renderPermissionsTable();
        } catch (e) {
            console.error(e);
            alert("Error deleting scroller: " + e.message);
        }
    };

    if (createScrollerForm) {
        createScrollerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = newScrollerTitleInput.value.trim();
            if (title === '') return;

            try {
                const lectures = await DB.getVideoLectures();
                // Sequential Cxx ID generation
                const nextNum = lectures.length > 0 ? Math.max(...lectures.map(l => parseInt(l.id.replace('C', '')) || 100)) + 1 : 101;
                const newId = 'C' + nextNum;

                lectures.push({
                    id: newId,
                    title: title,
                    videos: []
                });

                await DB.setVideoLectures(lectures);
                newScrollerTitleInput.value = '';
                alert(`Scroller "${title}" created successfully with ID: ${newId}`);
                await renderScrollersList();
                await renderPermissionsTable();
            } catch (err) {
                console.error(err);
                alert("Error creating scroller: " + err.message);
            }
        });
    }

    if (manageVideoScrollerSelect) {
        manageVideoScrollerSelect.addEventListener('change', (e) => {
            showScrollerVideos(e.target.value);
        });
    }

    async function showScrollerVideos(scrollerId) {
        const lectures = await DB.getVideoLectures();
        const scroller = lectures.find(l => l.id === scrollerId);
        if (!scroller) return;

        addVideoFormTitle.textContent = `Add Lecture to ${scroller.title}`;
        addVideoForm.style.display = 'block';
        scrollerVideosPlaceholder.style.display = 'none';
        scrollerVideosListContainer.style.display = 'block';

        renderVideosTable(scroller);
    }

    function renderVideosTable(scroller) {
        if (!scrollerVideosTableBody) return;
        scrollerVideosTableBody.innerHTML = '';
        const videos = scroller.videos || [];

        if (videos.length === 0) {
            scrollerVideosTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No lectures added to this scroller yet.</td></tr>';
            return;
        }

        videos.forEach((video, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${video.title || 'Untitled'}</strong></td>
                <td><a href="${video.link}" target="_blank" style="word-break: break-all; font-size: 0.85rem; color: var(--primary-light); text-decoration: none;">${video.link || 'No Link'}</a></td>
                <td style="text-align: right; display: flex; gap: 0.3rem; justify-content: flex-end;">
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="editVideo('${scroller.id}', ${index})">Edit</button>
                    <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: #dc2626; border-color: #dc2626;" onclick="deleteVideo('${scroller.id}', ${index})">Remove</button>
                </td>
            `;
            scrollerVideosTableBody.appendChild(tr);
        });
    }

    // Multi-row video inputs handler
    const addAnotherVideoRowBtn = document.getElementById('addAnotherVideoRowBtn');
    const addVideoRowsContainer = document.getElementById('addVideoRowsContainer');

    function updateRemoveRowButtonsVisibility() {
        if (!addVideoRowsContainer) return;
        const rows = addVideoRowsContainer.querySelectorAll('.video-input-row');
        const removeBtns = addVideoRowsContainer.querySelectorAll('.remove-input-row-btn');
        removeBtns.forEach(btn => {
            btn.style.display = rows.length > 1 ? 'block' : 'none';
        });
    }

    if (addAnotherVideoRowBtn && addVideoRowsContainer) {
        addAnotherVideoRowBtn.addEventListener('click', () => {
            const newRow = document.createElement('div');
            newRow.className = 'video-input-row';
            newRow.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: flex-end;';
            newRow.innerHTML = `
                <div style="flex: 1;">
                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Video Title</label>
                    <input class="form-input video-row-title" type="text" placeholder="e.g. LECTURE 1" required style="padding: 0.4rem 0.6rem;">
                </div>
                <div style="flex: 1.5;">
                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Video Link (YouTube/Telegram)</label>
                    <input class="form-input video-row-link" type="url" placeholder="e.g. https://youtu.be/..." required style="padding: 0.4rem 0.6rem;">
                </div>
                <button type="button" class="btn btn-outline remove-input-row-btn" style="padding: 0.4rem; color: #dc2626; border-color: #fca5a5;" title="Remove this row">✕</button>
            `;
            addVideoRowsContainer.appendChild(newRow);

            newRow.querySelector('.remove-input-row-btn').addEventListener('click', () => {
                newRow.remove();
                updateRemoveRowButtonsVisibility();
            });

            updateRemoveRowButtonsVisibility();
        });
    }

    if (addVideoRowsContainer) {
        addVideoRowsContainer.querySelectorAll('.remove-input-row-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.video-input-row').remove();
                updateRemoveRowButtonsVisibility();
            });
        });
    }

    if (addVideoForm) {
        addVideoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const scrollerId = manageVideoScrollerSelect.value;
            if (!scrollerId) return;

            const rows = addVideoRowsContainer.querySelectorAll('.video-input-row');
            const newVideos = [];
            rows.forEach(row => {
                const title = row.querySelector('.video-row-title').value.trim();
                const link = row.querySelector('.video-row-link').value.trim();
                if (title && link) {
                    newVideos.push({ title, link });
                }
            });

            if (newVideos.length === 0) return;

            try {
                const lectures = await DB.getVideoLectures();
                const scroller = lectures.find(l => l.id === scrollerId);
                if (scroller) {
                    if (!scroller.videos) scroller.videos = [];
                    scroller.videos.push(...newVideos);
                    await DB.setVideoLectures(lectures);

                    // Reset to single row input
                    addVideoRowsContainer.innerHTML = `
                        <div class="video-input-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; align-items: flex-end;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Video Title</label>
                                <input class="form-input video-row-title" type="text" placeholder="e.g. LECTURE 1" required style="padding: 0.4rem 0.6rem;">
                            </div>
                            <div style="flex: 1.5;">
                                <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">Video Link (YouTube/Telegram)</label>
                                <input class="form-input video-row-link" type="url" placeholder="e.g. https://youtu.be/..." required style="padding: 0.4rem 0.6rem;">
                            </div>
                            <button type="button" class="btn btn-outline remove-input-row-btn" style="padding: 0.4rem; color: #dc2626; border-color: #fca5a5; display: none;" title="Remove this row">✕</button>
                        </div>
                    `;

                    addVideoRowsContainer.querySelector('.remove-input-row-btn').addEventListener('click', (ev) => {
                        ev.target.closest('.video-input-row').remove();
                        updateRemoveRowButtonsVisibility();
                    });

                    updateRemoveRowButtonsVisibility();

                    alert(`Successfully added ${newVideos.length} video(s) to scroller!`);
                    await showScrollerVideos(scrollerId);
                }
            } catch (err) {
                console.error(err);
                alert("Error adding videos: " + err.message);
            }
        });
    }

    // Inline Table Editor for existing links
    window.editVideo = (scrollerId, index) => {
        if (!scrollerVideosTableBody) return;
        const rows = scrollerVideosTableBody.querySelectorAll('tr');
        const row = rows[index];
        if (!row) return;

        const titleCell = row.querySelectorAll('td')[0];
        const linkCell = row.querySelectorAll('td')[1];
        const actionCell = row.querySelectorAll('td')[2];

        const currentTitle = titleCell.querySelector('strong').textContent.trim();
        const currentLink = linkCell.querySelector('a') ? linkCell.querySelector('a').getAttribute('href') : '';

        titleCell.innerHTML = `<input class="form-input inline-edit-title" value="${currentTitle}" style="padding: 0.3rem 0.5rem; font-size: 0.85rem;" required>`;
        linkCell.innerHTML = `<input class="form-input inline-edit-link" type="url" value="${currentLink}" style="padding: 0.3rem 0.5rem; font-size: 0.85rem;" required>`;

        actionCell.innerHTML = `
            <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background: #22c55e; color: white; border-color: #22c55e;" onclick="saveInlineVideoEdit('${scrollerId}', ${index}, this)">Save</button>
            <button class="btn btn-outline" style="padding: 0.2rem 0.5rem; font-size: 0.8rem;" onclick="cancelInlineVideoEdit('${scrollerId}')">Cancel</button>
        `;
    };

    window.cancelInlineVideoEdit = async (scrollerId) => {
        await showScrollerVideos(scrollerId);
    };

    window.saveInlineVideoEdit = async (scrollerId, index, btnEl) => {
        const row = btnEl.closest('tr');
        if (!row) return;

        const newTitle = row.querySelector('.inline-edit-title').value.trim();
        const newLink = row.querySelector('.inline-edit-link').value.trim();

        if (newTitle === '' || newLink === '') {
            return alert("Title and link cannot be empty.");
        }

        try {
            const lectures = await DB.getVideoLectures();
            const scroller = lectures.find(l => l.id === scrollerId);
            if (scroller && scroller.videos && scroller.videos[index]) {
                scroller.videos[index] = { title: newTitle, link: newLink };
                await DB.setVideoLectures(lectures);
                alert("Lecture updated successfully!");
                await showScrollerVideos(scrollerId);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving video update: " + e.message);
        }
    };

    window.deleteVideo = async (scrollerId, index) => {
        if (!confirm("Are you sure you want to remove this video lecture from the scroller?")) return;

        try {
            const lectures = await DB.getVideoLectures();
            const scroller = lectures.find(l => l.id === scrollerId);
            if (scroller && scroller.videos) {
                scroller.videos.splice(index, 1);
                await DB.setVideoLectures(lectures);
                alert("Video removed successfully!");
                await showScrollerVideos(scrollerId);
            }
        } catch (e) {
            console.error(e);
            alert("Error removing video: " + e.message);
        }
    };

    // === Admin Attendance Dashboard ===
    const adminAttendanceDateInput = document.getElementById('adminAttendanceDate');
    const adminAttendanceFormTableBody = document.querySelector('#adminAttendanceFormTable tbody');
    const adminSaveAttendanceBtn = document.getElementById('adminSaveAttendanceBtn');
    const adminAttendanceTabularReportTableBody = document.querySelector('#adminAttendanceTabularReportTable tbody');
    const adminAttendanceTabularHeader = document.getElementById('adminAttendanceTabularHeader');

    // Date pre-fill helper (local timezone safe)
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const todayYYYYMMDD = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

    if (adminAttendanceDateInput) {
        adminAttendanceDateInput.value = todayYYYYMMDD;
        adminAttendanceDateInput.addEventListener('change', renderAdminAttendanceForm);
    }

    async function renderAdminAttendanceForm() {
        if (!adminAttendanceFormTableBody || !adminAttendanceDateInput) return;
        const selectedDate = adminAttendanceDateInput.value;
        if (!selectedDate) return;

        const students = await DB.getStudents();
        const attendanceList = await DB.getAttendance();
        const dayRecord = attendanceList.find(r => r.date === selectedDate);
        
        adminAttendanceFormTableBody.innerHTML = '';
        
        if (students.length === 0) {
            adminAttendanceFormTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No active students.</td></tr>';
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
                    <div class="admin-attendance-toggle-group" style="display: flex; border: 1px solid var(--gray-300); border-radius: var(--radius-md); overflow: hidden; width: 100px; margin: 0 auto;" data-student-id="${student.id}" data-status="${status}">
                        <button type="button" class="toggle-btn p-btn" style="flex: 1; border: none; padding: 0.3rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">P</button>
                        <button type="button" class="toggle-btn a-btn" style="flex: 1; border: none; padding: 0.3rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s;">A</button>
                    </div>
                </td>
            `;
            adminAttendanceFormTableBody.appendChild(tr);

            const toggleGroup = tr.querySelector('.admin-attendance-toggle-group');
            const pBtn = toggleGroup.querySelector('.p-btn');
            const aBtn = toggleGroup.querySelector('.a-btn');

            function setToggleStatus(newStatus) {
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

            setToggleStatus(status);

            pBtn.addEventListener('click', () => setToggleStatus('present'));
            aBtn.addEventListener('click', () => setToggleStatus('absent'));
        });
    }

    if (adminSaveAttendanceBtn) {
        adminSaveAttendanceBtn.addEventListener('click', async () => {
            const selectedDate = adminAttendanceDateInput.value;
            if (!selectedDate) return alert('Select date first.');

            const toggles = document.querySelectorAll('.admin-attendance-toggle-group');
            const records = {};
            toggles.forEach(t => {
                records[t.dataset.studentId] = t.dataset.status;
            });

            try {
                const attendanceList = await DB.getAttendance();
                const existingIdx = attendanceList.findIndex(r => r.date === selectedDate);
                const newRecord = {
                    date: selectedDate,
                    records: records,
                    takenBy: 'Admin'
                };

                if (existingIdx !== -1) {
                    attendanceList[existingIdx] = newRecord;
                } else {
                    attendanceList.push(newRecord);
                }

                await DB.setAttendance(attendanceList);
                alert("Attendance saved successfully!");
                await renderAdminAttendanceOverviewTable();
            } catch (err) {
                console.error(err);
                alert("Error saving attendance: " + err.message);
            }
        });
    }

    const adminAttendanceSortSelect = document.getElementById('adminAttendanceSortSelect');
    if (adminAttendanceSortSelect) {
        adminAttendanceSortSelect.addEventListener('change', () => {
            renderAdminAttendanceOverviewTable();
        });
    }

    async function renderAdminAttendanceOverviewTable() {
        if (!adminAttendanceTabularReportTableBody || !adminAttendanceTabularHeader) return;

        const students = await DB.getStudents();
        const attendanceList = await DB.getAttendance();

        // Extract and sort dates chronologically (oldest-to-newest)
        const sortedDates = [...new Set(attendanceList.map(a => a.date))].sort((a, b) => a.localeCompare(b));

        // Format dates to look like "02 JUL" for headers
        const formatHeaderDate = (dateStr) => {
            const parts = dateStr.split('-');
            if (parts.length !== 3) return dateStr;
            const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
            const day = parts[2];
            const monthIdx = parseInt(parts[1]) - 1;
            return `${day} ${months[monthIdx]}`;
        };

        // Render table headers
        let headerRowHTML = `
            <th style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: left; font-weight: 700; color: var(--primary-color); position: sticky; left: 0; background: #f8fafc; z-index: 12; min-width: 150px;">Student Name</th>
            <th style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: center; font-weight: 700; color: var(--primary-color); width: 95px; position: sticky; left: 150px; background: #f8fafc; z-index: 12;">Rate (%)</th>
        `;
        sortedDates.forEach(date => {
            headerRowHTML += `
                <th style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-dark); min-width: 70px;">
                    ${formatHeaderDate(date)}
                </th>
            `;
        });
        adminAttendanceTabularHeader.innerHTML = headerRowHTML;

        // Render student rows
        adminAttendanceTabularReportTableBody.innerHTML = '';
        if (students.length === 0) {
            adminAttendanceTabularReportTableBody.innerHTML = `<tr><td colspan="${2 + sortedDates.length}" style="text-align: center; color: var(--text-light); padding: 2rem;">No students found.</td></tr>`;
            return;
        }

        // Compute attendance rates for sorting
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
            student._attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : -1;
        });

        // Apply sorting based on select control
        const sortVal = adminAttendanceSortSelect ? adminAttendanceSortSelect.value : 'name-asc';
        students.sort((a, b) => {
            if (sortVal === 'name-asc') return a.name.localeCompare(b.name);
            if (sortVal === 'name-desc') return b.name.localeCompare(a.name);
            if (sortVal === 'rate-desc') return b._attendanceRate - a._attendanceRate;
            if (sortVal === 'rate-asc') return a._attendanceRate - b._attendanceRate;
            if (sortVal === 'id-asc') return a.id.localeCompare(b.id, undefined, { numeric: true });
            if (sortVal === 'id-desc') return b.id.localeCompare(a.id, undefined, { numeric: true });
            return a.name.localeCompare(b.name);
        });

        students.forEach(student => {
            const rateVal = student._attendanceRate >= 0 ? student._attendanceRate.toFixed(1) : null;
            const rateText = rateVal !== null ? `${rateVal}%` : 'N/A';

            let rateColor = '#64748b';
            if (rateVal !== null) {
                const r = parseFloat(rateVal);
                if (r >= 85) rateColor = '#166534';
                else if (r >= 75) rateColor = '#b45309';
                else rateColor = '#b91c1c';
            }

            let rowHTML = `
                <td style="padding: 0.75rem; border: 1px solid var(--gray-200); position: sticky; left: 0; background: #ffffff; z-index: 5; min-width: 150px;"><strong>${student.name}</strong> <small style="color:var(--text-light); font-size: 0.75rem; display:block;">(${student.id})</small></td>
                <td style="padding: 0.75rem; border: 1px solid var(--gray-200); text-align: center; font-weight: 700; color: ${rateColor}; position: sticky; left: 150px; background: #ffffff; z-index: 5;">${rateText}</td>
            `;

            // Render P / A cells chronologically
            sortedDates.forEach(date => {
                const dayRecord = attendanceList.find(a => a.date === date);
                let cellText = '-';
                let cellColor = '#94a3b8';
                let bgStyle = '';

                if (dayRecord && dayRecord.records && dayRecord.records[student.id]) {
                    const status = dayRecord.records[student.id];
                    if (status === 'present') {
                        cellText = 'P';
                        cellColor = '#166534';
                        bgStyle = 'background-color: #dcfce7;';
                    } else {
                        cellText = 'A';
                        cellColor = '#991b1b';
                        bgStyle = 'background-color: #fee2e2;';
                    }
                }

                rowHTML += `
                    <td style="padding: 0.5rem; border: 1px solid var(--gray-200); text-align: center; font-weight: 700; color: ${cellColor}; ${bgStyle}">
                        ${cellText}
                    </td>
                `;
            });

            const tr = document.createElement('tr');
            tr.innerHTML = rowHTML;
            adminAttendanceTabularReportTableBody.appendChild(tr);
        });
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        DB.logout();
        window.location.href = 'index.html';
    });

    const batchFilter = document.getElementById('batchProgressFilter');
    if (batchFilter) {
        batchFilter.addEventListener('change', () => {
            renderBatchProgress();
        });
    }

    // Initial render
    await renderStudents();
    await renderAlumni();
    await renderTeachers();
    await renderSalaries();
    await renderCourses();
    await calculateFinancials();
    await renderScrollersList();
    await renderAdminAttendanceForm();
    await renderAdminAttendanceOverviewTable();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminDashboard);
} else {
    initAdminDashboard();
}
