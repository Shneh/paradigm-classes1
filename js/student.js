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
                feeCyclesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No joining date recorded. Please contact Admin.</td></tr>';
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

            let rowHtml = `<td>Cycle ${cycleNum}</td><td>${DB.formatDate(startStr)}</td><td>${DB.formatDate(endStr)}</td>`;
            
            const paymentRecord = payments.find(p => p.cycleStart === startStr);
            if (paymentRecord) {
                const fine = paymentRecord.finePaid || 0;
                const totalPaid = baseFees + fine;
                const statusBadge = `<span class="badge badge-success" style="background:#dcfce7;color:#166534;padding:0.25rem 0.5rem;border-radius:99px;font-weight:700;">Paid</span>`;

                rowHtml += `
                    <td class="text-right">₹${baseFees.toLocaleString('en-IN')}</td>
                    <td class="text-right">₹${fine.toLocaleString('en-IN')}</td>
                    <td class="text-right" style="font-weight:700; color:#166534;">₹${totalPaid.toLocaleString('en-IN')}</td>
                    <td>${statusBadge}<br><small>by ${paymentRecord.markedBy}</small><br><small>on ${DB.formatDate(paymentRecord.paidOn)}</small></td>
                `;
            } else {
                const dueDate = new Date(cycleStartDate);
                dueDate.setDate(dueDate.getDate() + 5);
                const delayDays = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
                const currentFine = delayDays * 30;
                const totalDue = baseFees + currentFine;
                
                rowHtml += `
                    <td class="text-right">₹${baseFees.toLocaleString('en-IN')}</td>
                    <td class="text-right">₹${currentFine.toLocaleString('en-IN')}</td>
                    <td class="text-right" style="font-weight:700; color:#166534;">₹${totalDue.toLocaleString('en-IN')}</td>
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

    let calendarDate = new Date();

    async function renderAttendance() {
        const calendarDaysGrid = document.getElementById('calendarDaysGrid');
        const calendarMonthTitle = document.getElementById('calendarMonthTitle');
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        if (!attendanceRateEl || !calendarDaysGrid) return;

        const attendanceList = await DB.getAttendance();
        
        let totalDays = 0;
        let presentDays = 0;
        const attendanceMap = {};

        attendanceList.forEach(day => {
            if (day.records && day.records[user.id]) {
                totalDays++;
                const status = day.records[user.id]; // 'present' or 'absent'
                if (status === 'present') {
                    presentDays++;
                }
                attendanceMap[day.date] = {
                    status: status,
                    takenBy: day.takenBy || 'Teacher'
                };
            }
        });

        if (totalDays === 0) {
            attendanceRateEl.textContent = 'N/A';
        } else {
            const percentage = ((presentDays / totalDays) * 100).toFixed(1);
            attendanceRateEl.textContent = `${percentage}%`;

            let color = '#64748b';
            if (percentage >= 85) color = '#166534';
            else if (percentage >= 75) color = '#b45309';
            else color = '#b91c1c';
            attendanceRateEl.style.color = color;
        }

        function drawCalendar() {
            if (!calendarDaysGrid || !calendarMonthTitle) return;

            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();

            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;
            calendarDaysGrid.innerHTML = '';

            const firstDayIndex = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            // Padding days before start of month
            for (let i = 0; i < firstDayIndex; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.style.padding = '0.4rem';
                calendarDaysGrid.appendChild(emptyCell);
            }

            // Days of the month
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const rec = attendanceMap[dateStr];

                const dayCell = document.createElement('div');
                dayCell.style.cssText = 'display: flex; align-items: center; justify-content: center; padding: 0.2rem;';

                const circle = document.createElement('div');
                circle.textContent = d;
                circle.style.cssText = `
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin: auto;
                    transition: transform 0.2s ease;
                    cursor: default;
                `;

                if (rec) {
                    if (rec.status === 'present') {
                        // Green Circle for Present
                        circle.style.background = '#dcfce7';
                        circle.style.color = '#15803d';
                        circle.style.border = '1.5px solid #22c55e';
                        circle.title = `${dateStr}: PRESENT (Marked by ${rec.takenBy})`;
                    } else {
                        // Red Circle for Absent
                        circle.style.background = '#fee2e2';
                        circle.style.color = '#b91c1c';
                        circle.style.border = '1.5px solid #ef4444';
                        circle.title = `${dateStr}: ABSENT (Marked by ${rec.takenBy})`;
                    }
                } else {
                    // Grey Circle for N/A
                    circle.style.background = '#f1f5f9';
                    circle.style.color = '#94a3b8';
                    circle.style.border = '1px solid #cbd5e1';
                    circle.title = `${dateStr}: N/A`;
                }

                dayCell.appendChild(circle);
                calendarDaysGrid.appendChild(dayCell);
            }
        }

        drawCalendar();

        if (prevMonthBtn && !prevMonthBtn.hasAttribute('data-bound')) {
            prevMonthBtn.setAttribute('data-bound', 'true');
            prevMonthBtn.addEventListener('click', () => {
                calendarDate.setMonth(calendarDate.getMonth() - 1);
                drawCalendar();
            });
        }

        if (nextMonthBtn && !nextMonthBtn.hasAttribute('data-bound')) {
            nextMonthBtn.setAttribute('data-bound', 'true');
            nextMonthBtn.addEventListener('click', () => {
                calendarDate.setMonth(calendarDate.getMonth() + 1);
                drawCalendar();
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

            const studentCoinsEl = document.getElementById('studentCoins');
            if (studentCoinsEl) {
                studentCoinsEl.textContent = `${(student.coins || 0).toLocaleString('en-IN')} Coins`;
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
            let rewardedSet = new Set(student.rewardedLectures || []);
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
                            <label class="video-left ${isCompleted ? 'is-locked' : ''}">
                                <div class="custom-checkbox-wrapper">
                                    <input type="checkbox" class="custom-checkbox-input video-checkbox" data-video-key="${videoKey}" ${isCompleted ? 'checked disabled' : ''}>
                                    <span class="custom-checkmark"></span>
                                </div>
                                <span class="video-title">${video.title || `Lecture ${idx + 1}`}</span>
                                ${isCompleted ? '<span class="lock-indicator" style="font-size:0.75rem; color:#166534; font-weight:700; background:#dcfce7; padding:0.15rem 0.4rem; border-radius:99px; margin-left:0.5rem; display:inline-flex; align-items:center; gap:0.2rem;">🔒 Watched</span>' : ''}
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
                    
                    // Once marked watched, ticks cannot be unticked
                    if (!cb.checked) {
                        cb.checked = true;
                        return;
                    }

                    // Lock checkbox immediately
                    cb.disabled = true;
                    const parentLabel = cb.closest('.video-left');
                    if (parentLabel) {
                        parentLabel.classList.add('is-locked');
                        if (!parentLabel.querySelector('.lock-indicator')) {
                            const badge = document.createElement('span');
                            badge.className = 'lock-indicator';
                            badge.style.cssText = 'font-size:0.75rem; color:#166534; font-weight:700; background:#dcfce7; padding:0.15rem 0.4rem; border-radius:99px; margin-left:0.5rem; display:inline-flex; align-items:center; gap:0.2rem;';
                            badge.innerHTML = '🔒 Watched';
                            parentLabel.appendChild(badge);
                        }
                    }

                    completedSet.add(key);
                    let newlyAwarded = false;
                    if (!rewardedSet.has(key)) {
                        rewardedSet.add(key);
                        newlyAwarded = true;
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
                            allStudents[sIdx].rewardedLectures = Array.from(rewardedSet);
                            if (newlyAwarded) {
                                allStudents[sIdx].coins = (allStudents[sIdx].coins || 0) + 10;
                                const currentCoins = allStudents[sIdx].coins;
                                if (studentCoinsEl) {
                                    studentCoinsEl.textContent = `${currentCoins.toLocaleString('en-IN')} Coins`;
                                }
                                showCoinToast(`+10 Coins awarded for completing lecture! Total: ${currentCoins} Coins`);
                            }
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

    async function renderStudentNotes() {
        const container = document.getElementById('studentNotesContainer');
        if (!container) return;

        try {
            const students = await DB.getStudents();
            const student = students.find(s => s.id.toLowerCase() === user.id.toLowerCase());
            
            if (!student) {
                container.innerHTML = '<div style="color: var(--text-light); font-size: 0.9rem; font-style: italic;">Student record not found.</div>';
                return;
            }

            const notes = student.notes || [];
            if (notes.length === 0) {
                container.innerHTML = `
                    <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 1.25rem; text-align: center; color: var(--text-light);">
                        <p style="margin: 0; font-size: 0.9rem; font-weight: 500;">No notes or announcements posted for you yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = '';
            const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            sortedNotes.forEach(note => {
                const noteCard = document.createElement('div');
                noteCard.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);';
                
                const isTeacherNote = note.authorRole === 'teacher';
                const authorBadge = isTeacherNote 
                    ? `<span class="badge" style="background:#dcfce7; color:#166534; font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:99px;">Teacher (${window.escapeHTML(note.authorName || 'Teacher')})</span>`
                    : `<span class="badge" style="background:#dbeafe; color:#1e40af; font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:99px;">Admin</span>`;
                
                const dateStr = note.date || DB.formatDate(note.createdAt);

                noteCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.6rem;">
                            ${authorBadge}
                        </div>
                        <div style="font-size: 0.8rem; color: var(--text-light); font-weight: 600;">
                            📅 ${dateStr}
                        </div>
                    </div>
                    <div style="font-size: 0.95rem; color: var(--text-dark); white-space: pre-wrap; line-height: 1.6; font-weight: 500;">
                        ${window.escapeHTML(note.text)}
                    </div>
                `;
                container.appendChild(noteCard);
            });
        } catch (e) {
            console.error("Error rendering student notes:", e);
            container.innerHTML = '<div style="color: #dc2626; font-size: 0.9rem;">Error loading notes.</div>';
        }
    }

    await renderStudentNotes();
    await renderLectureProgress();
    await renderFees();
    await renderResults();
    await renderAttendance();
}

function showCoinToast(message) {
    let toast = document.getElementById('coinToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'coinToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 99px;
            box-shadow: 0 10px 25px rgba(30, 58, 138, 0.4);
            font-weight: 700;
            font-size: 1rem;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            transform: translateY(100px);
            opacity: 0;
            border: 2px solid #f59e0b;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.transform = 'translateY(100px)';
        toast.style.opacity = '0';
    }, 3500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentDashboard);
} else {
    initStudentDashboard();
}
