async function initStudentDashboard() {
    // Auth Check
    const user = Auth.checkAuth('student');
    if (!user) return;

    document.getElementById('welcomeMessage').textContent = `Welcome, ${user.name}`;

    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const cumulativeScoreEl = document.getElementById('cumulativeScore');
    const feeCyclesTableBody = document.querySelector('#feeCyclesTable tbody');

    // Attendance DOM Elements
    const attendanceRateEl = document.getElementById('attendanceRate');
    const attendanceTableBody = document.querySelector('#attendanceTable tbody');

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

    async function renderAttendance() {
        if (!attendanceTableBody || !attendanceRateEl) return;

        const attendanceList = await DB.getAttendance();
        
        let totalDays = 0;
        let presentDays = 0;
        const records = [];

        const sortedAttendance = [...attendanceList].sort((a, b) => b.date.localeCompare(a.date));

        sortedAttendance.forEach(day => {
            if (day.records && day.records[user.id]) {
                totalDays++;
                const status = day.records[user.id];
                if (status === 'present') {
                    presentDays++;
                }
                records.push({
                    date: day.date,
                    status: status,
                    takenBy: day.takenBy || 'Teacher'
                });
            }
        });

        if (totalDays === 0) {
            attendanceRateEl.textContent = 'N/A';
            attendanceTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-light);">No attendance records found.</td></tr>';
        } else {
            const percentage = ((presentDays / totalDays) * 100).toFixed(1);
            attendanceRateEl.textContent = `${percentage}%`;

            let color = '#64748b';
            if (percentage >= 85) {
                color = '#166534';
            } else if (percentage >= 75) {
                color = '#b45309';
            } else {
                color = '#b91c1c';
            }
            attendanceRateEl.style.color = color;

            attendanceTableBody.innerHTML = '';
            records.forEach(rec => {
                const tr = document.createElement('tr');
                const badgeStyle = rec.status === 'present' 
                    ? 'background: #dcfce7; color: #166534;' 
                    : 'background: #fee2e2; color: #991b1b;';
                const statusText = rec.status.toUpperCase();

                tr.innerHTML = `
                    <td>${DB.formatDate(rec.date)}</td>
                    <td>
                        <span class="badge" style="padding: 0.25rem 0.5rem; border-radius: 99px; font-weight: 700; font-size: 0.8rem; ${badgeStyle}">${statusText}</span>
                    </td>
                    <td>${rec.takenBy}</td>
                `;
                attendanceTableBody.appendChild(tr);
            });
        }
    }

    async function renderLectureProgress() {
        const sectionsContainer = document.getElementById('lectureSectionsContainer');
        const overallProgressText = document.getElementById('overallLectureProgress');
        const progressBar = document.getElementById('lectureProgressBar');
        if (!sectionsContainer) return;

        try {
            const lectures = await DB.getVideoLectures();
            const students = await DB.getStudents();
            const student = students.find(s => s.id.toLowerCase() === user.id.toLowerCase());
            
            if (!student) {
                sectionsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light);">Student record not found.</div>';
                return;
            }

            const permissions = student.lecturePermissions || [];
            const accessibleSections = lectures.filter(l => permissions.includes(l.id));

            if (accessibleSections.length === 0) {
                sectionsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light); font-weight: 500;">No video lectures are currently accessible to you. Please contact Admin/Teacher for access.</div>';
                overallProgressText.textContent = '0 / 0 Completed (0% Done)';
                progressBar.style.width = '0%';
                return;
            }

            let completedSet = new Set(student.completedLectures || []);
            let totalVideos = 0;
            let completedVideos = 0;

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
            overallProgressText.textContent = `${completedVideos} / ${totalVideos} Completed (${overallPercent}% Done)`;
            progressBar.style.width = `${overallPercent}%`;

            sectionsContainer.innerHTML = '';

            accessibleSections.forEach(section => {
                const videos = section.videos || [];
                let sectionTotal = videos.length;
                let sectionCompleted = 0;

                const videoRowsHtml = videos.map((video, idx) => {
                    const videoKey = `${section.id}::${video.title}`;
                    const isCompleted = completedSet.has(videoKey);
                    if (isCompleted) sectionCompleted++;

                    const watchBtnHtml = video.link 
                        ? `<a href="${video.link}" target="_blank" class="btn-watch">
                            <svg style="width:12px; height:12px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg> Watch
                           </a>`
                        : `<span style="font-size:0.8rem; color:var(--text-light);">(No Link)</span>`;

                    return `
                        <div class="video-row" data-video-key="${videoKey}">
                            <label class="video-left">
                                <div class="custom-checkbox-wrapper">
                                    <input type="checkbox" class="custom-checkbox-input video-checkbox" data-video-key="${videoKey}" ${isCompleted ? 'checked' : ''}>
                                    <span class="custom-checkmark"></span>
                                </div>
                                <span class="video-title">${video.title || `Lecture ${idx + 1}`}</span>
                            </label>
                            <div class="video-right">
                                ${watchBtnHtml}
                            </div>
                        </div>
                    `;
                }).join('');

                const sectionPercent = sectionTotal > 0 ? Math.round((sectionCompleted / sectionTotal) * 100) : 0;

                const sectionEl = document.createElement('div');
                sectionEl.className = 'lecture-section';
                sectionEl.id = `section-${section.id}`;
                sectionEl.innerHTML = `
                    <button class="lecture-section-header">
                        <span class="lecture-section-title">
                            <svg style="width:16px; height:16px; color:var(--primary-color);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            ${section.title}
                        </span>
                        <div class="lecture-section-meta">
                            <span class="lecture-section-badge" id="badge-${section.id}">${sectionCompleted} / ${sectionTotal} Done (${sectionPercent}%)</span>
                            <svg class="lecture-section-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </button>
                    <div class="lecture-section-content">
                        ${videoRowsHtml}
                    </div>
                `;

                const header = sectionEl.querySelector('.lecture-section-header');
                const content = sectionEl.querySelector('.lecture-section-content');
                header.addEventListener('click', () => {
                    const isOpening = !sectionEl.classList.contains('active');
                    if (isOpening) {
                        sectionEl.classList.add('active');
                        content.style.height = '0px';
                        requestAnimationFrame(() => {
                            content.style.height = content.scrollHeight + 'px';
                        });
                        const onEnd = () => {
                            if (sectionEl.classList.contains('active')) {
                                content.style.height = 'auto';
                            }
                            content.removeEventListener('transitionend', onEnd);
                        };
                        content.addEventListener('transitionend', onEnd);
                    } else {
                        content.style.height = content.scrollHeight + 'px';
                        requestAnimationFrame(() => {
                            content.style.height = '0px';
                        });
                        sectionEl.classList.remove('active');
                    }
                });

                sectionsContainer.appendChild(sectionEl);
            });

            sectionsContainer.addEventListener('change', async (e) => {
                if (e.target.classList.contains('video-checkbox')) {
                    const cb = e.target;
                    const key = cb.getAttribute('data-video-key');
                    const isChecked = cb.checked;

                    if (isChecked) {
                        completedSet.add(key);
                    } else {
                        completedSet.delete(key);
                    }

                    let newCompleted = 0;
                    accessibleSections.forEach(section => {
                        let secCompleted = 0;
                        const vds = section.videos || [];
                        vds.forEach(v => {
                            const vKey = `${section.id}::${v.title}`;
                            if (completedSet.has(vKey)) {
                                newCompleted++;
                                secCompleted++;
                            }
                        });
                        const badge = document.getElementById(`badge-${section.id}`);
                        if (badge) {
                            const secTotal = vds.length;
                            const secPct = secTotal > 0 ? Math.round((secCompleted / secTotal) * 100) : 0;
                            badge.textContent = `${secCompleted} / ${secTotal} Done (${secPct}%)`;
                        }
                    });

                    const newPercent = totalVideos > 0 ? Math.round((newCompleted / totalVideos) * 100) : 0;
                    overallProgressText.textContent = `${newCompleted} / ${totalVideos} Completed (${newPercent}% Done)`;
                    progressBar.style.width = `${newPercent}%`;

                    try {
                        const allStudents = await DB.getStudents();
                        const sIdx = allStudents.findIndex(s => s.id.toLowerCase() === user.id.toLowerCase());
                        if (sIdx !== -1) {
                            allStudents[sIdx].completedLectures = Array.from(completedSet);
                            await DB.setStudents(allStudents);
                        }
                    } catch (dbError) {
                        console.error("Error saving completed lectures to DB:", dbError);
                        alert("Could not sync progress with database. Check internet connection.");
                    }
                }
            });

        } catch (error) {
            console.error("Error in renderLectureProgress:", error);
            sectionsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: #dc2626;">Error loading lecture progress.</div>';
        }
    }

    await renderLectureProgress();
    await renderFees();
    await renderResults();
    await renderAttendance();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentDashboard);
} else {
    initStudentDashboard();
}
