async function initStudentDashboard() {
    // Auth Check
    const user = Auth.checkAuth('student');
    if (!user) return;

    // Elements
    const welcomeMessage = document.getElementById('welcomeMessage');
    const studentAvatar = document.getElementById('studentAvatar');
    const studentClassBadge = document.getElementById('studentClassBadge');
    const studentEnrollmentInfo = document.getElementById('studentEnrollmentInfo');
    const studentCoinsEl = document.getElementById('studentCoins');
    const cumulativeScoreEl = document.getElementById('cumulativeScore');
    const attendanceRateEl = document.getElementById('attendanceRate');

    // Tab Navigation setup
    const tabBtns = document.querySelectorAll('.portal-tab-btn');
    const tabPanes = document.querySelectorAll('.portal-tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(`tab-${tabId}`);
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Load Student Profile Data
    const students = await DB.getStudents();
    const student = students.find(s => s.id.toLowerCase() === user.id.toLowerCase());

    if (student) {
        if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${student.name}`;
        if (studentAvatar) studentAvatar.textContent = student.name ? student.name.charAt(0).toUpperCase() : 'S';
        if (studentClassBadge) studentClassBadge.textContent = `Class ${student.class || 'N/A'}`;
        if (studentEnrollmentInfo) {
            studentEnrollmentInfo.textContent = `Student ID: ${student.id} | Enrolled: ${DB.formatDate(student.dateOfJoining) || 'Active'}`;
        }
        if (studentCoinsEl) {
            studentCoinsEl.textContent = `${(student.coins || 0).toLocaleString('en-IN')}`;
        }
    }

    // ================= 1. FEE CYCLES & RECEIPTS =================
    async function renderFees() {
        const feeCyclesTableBody = document.querySelector('#feeCyclesTable tbody');
        if (!feeCyclesTableBody) return;

        if (!student || !student.dateOfJoining) {
            feeCyclesTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color: var(--text-light);">No enrollment date recorded. Please contact Paradigm Admin.</td></tr>';
            return;
        }

        const payments = student.feePayments || [];
        const baseFees = student.fees || 0;

        let cycleStartDate = new Date(student.dateOfJoining);
        let cycleNum = 1;
        const today = new Date();
        feeCyclesTableBody.innerHTML = '';

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
                const statusBadge = `<span class="badge" style="background:#dcfce7;color:#166534;padding:0.25rem 0.65rem;border-radius:99px;font-weight:700;">Paid</span>`;

                rowHtml += `
                    <td class="text-right">₹${baseFees.toLocaleString('en-IN')}</td>
                    <td class="text-right">₹${fine.toLocaleString('en-IN')}</td>
                    <td class="text-right" style="font-weight:700; color:#166534;">₹${totalPaid.toLocaleString('en-IN')}</td>
                    <td>${statusBadge}<br><small style="color:var(--text-light);">by ${paymentRecord.markedBy || 'Admin'}</small><br><small style="color:var(--text-light);">on ${DB.formatDate(paymentRecord.paidOn)}</small></td>
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
                    <td class="text-right" style="font-weight:700; color:#1e40af;">₹${totalDue.toLocaleString('en-IN')}</td>
                    <td><span class="badge" style="background:#fef08a;color:#854d0e;padding:0.25rem 0.65rem;border-radius:99px;font-weight:700;">Unpaid</span></td>
                `;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = rowHtml;
            feeCyclesTableBody.appendChild(tr);

            cycleStartDate = endCycle;
            cycleNum++;
        }
    }

    // ================= 2. RESULTS & PERFORMANCE ANALYTICS =================
    let studentResultsList = [];
    let studentCumulativePct = 0;

    async function renderResultsAndAnalytics() {
        const resultsTableBody = document.querySelector('#resultsTable tbody');
        const scoreTrendChart = document.getElementById('scoreTrendChartContainer');
        const weakTopicsList = document.getElementById('weakTopicsList');

        const allTests = await DB.getTests();
        const publishedTests = allTests.filter(t => t.published);

        let totalMax = 0;
        let totalObtained = 0;
        let highestPct = -1;
        let highestTestName = 'N/A';
        studentResultsList = [];

        if (resultsTableBody) resultsTableBody.innerHTML = '';
        if (scoreTrendChart) scoreTrendChart.innerHTML = '';
        if (weakTopicsList) weakTopicsList.innerHTML = '';

        const weakItems = [];

        publishedTests.forEach(test => {
            const marksList = test.marks || [];
            const studentMarkObj = marksList.find(m => m.studentId.toLowerCase() === user.id.toLowerCase());
            
            // Calculate Class Average for this test
            let classTotalMarks = 0;
            let classStudentCount = 0;
            marksList.forEach(m => {
                if (typeof m.mark === 'number') {
                    classTotalMarks += m.mark;
                    classStudentCount++;
                }
            });
            const classAvgPct = classStudentCount > 0 ? ((classTotalMarks / (classStudentCount * test.maxMarks)) * 100).toFixed(1) : 'N/A';

            if (studentMarkObj) {
                const mark = studentMarkObj.mark;
                const max = test.maxMarks;
                const percentage = parseFloat(((mark / max) * 100).toFixed(1));

                totalMax += max;
                totalObtained += mark;

                if (percentage > highestPct) {
                    highestPct = percentage;
                    highestTestName = `${test.subject} (${percentage}%)`;
                }

                if (percentage < 60) {
                    weakItems.push({
                        subject: test.subject,
                        date: test.date,
                        obtained: mark,
                        max: max,
                        percentage: percentage
                    });
                }

                studentResultsList.push({
                    date: test.date,
                    subject: test.subject,
                    max: max,
                    mark: mark,
                    percentage: percentage,
                    classAvgPct: classAvgPct
                });

                if (resultsTableBody) {
                    const tr = document.createElement('tr');
                    const statusColor = percentage >= 75 ? '#166534' : (percentage >= 50 ? '#854d0e' : '#dc2626');
                    const statusBadge = percentage >= 75 
                        ? `<span class="badge" style="background:#dcfce7;color:#166534;font-size:0.75rem;font-weight:700;padding:0.2rem 0.5rem;border-radius:99px;">Mastery</span>` 
                        : (percentage >= 50 
                            ? `<span class="badge" style="background:#fef3c7;color:#854d0e;font-size:0.75rem;font-weight:700;padding:0.2rem 0.5rem;border-radius:99px;">Satisfactory</span>`
                            : `<span class="badge" style="background:#fee2e2;color:#dc2626;font-size:0.75rem;font-weight:700;padding:0.2rem 0.5rem;border-radius:99px;">Needs Revision</span>`);

                    tr.innerHTML = `
                        <td>${DB.formatDate(test.date)}</td>
                        <td style="font-weight:700; color:var(--text-dark);">${window.escapeHTML(test.subject)}</td>
                        <td class="text-right">${max}</td>
                        <td class="text-right" style="font-weight:700;">${mark}</td>
                        <td class="text-right" style="font-weight:800; color: ${statusColor};">${percentage}%</td>
                        <td class="text-right" style="color:var(--text-light); font-weight:600;">${classAvgPct !== 'N/A' ? classAvgPct + '%' : '—'}</td>
                        <td>${statusBadge}</td>
                    `;
                    resultsTableBody.appendChild(tr);
                }

                // Render Trend Visual Bar
                if (scoreTrendChart) {
                    const barWrap = document.createElement('div');
                    barWrap.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 60px;';
                    
                    const barHeight = Math.max(12, Math.round((percentage / 100) * 120));
                    const barColor = percentage >= 75 ? '#16a34a' : (percentage >= 50 ? '#3b82f6' : '#ef4444');

                    barWrap.innerHTML = `
                        <span style="font-size:0.75rem; font-weight:800; color:${barColor}; margin-bottom: 4px;">${percentage}%</span>
                        <div style="width: 28px; height: ${barHeight}px; background: ${barColor}; border-radius: 6px 6px 0 0; transition: height 0.4s ease;" title="${test.subject}: ${percentage}% (Class Avg: ${classAvgPct}%)"></div>
                        <span style="font-size: 0.7rem; font-weight: 600; color: var(--text-light); margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 55px;" title="${test.subject}">${test.subject}</span>
                    `;
                    scoreTrendChart.appendChild(barWrap);
                }
            }
        });

        // Summary Statistics
        const totalTestsCount = studentResultsList.length;
        document.getElementById('analyticsTotalTests').textContent = totalTestsCount;

        if (totalTestsCount === 0) {
            if (resultsTableBody) {
                resultsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-light);">No test results published for your student profile yet.</td></tr>';
            }
            if (scoreTrendChart) {
                scoreTrendChart.innerHTML = '<div style="color:var(--text-light); font-size:0.9rem; margin:auto;">No test trend data available.</div>';
            }
            if (cumulativeScoreEl) cumulativeScoreEl.textContent = 'N/A';
            document.getElementById('analyticsHighestScore').textContent = 'N/A';
            document.getElementById('analyticsCohortAvg').textContent = 'N/A';
            document.getElementById('analyticsAccuracy').textContent = 'N/A';
        } else {
            studentCumulativePct = ((totalObtained / totalMax) * 100).toFixed(1);
            if (cumulativeScoreEl) cumulativeScoreEl.textContent = `${studentCumulativePct}%`;

            document.getElementById('analyticsHighestScore').textContent = `${highestPct}%`;
            document.getElementById('analyticsHighestTest').textContent = highestTestName;
            document.getElementById('analyticsAccuracy').textContent = `${((totalObtained / totalMax) * 100).toFixed(1)}%`;

            // Calculate overall cohort average
            const allPublishedMarks = publishedTests.flatMap(t => t.marks || []).map(m => m.mark).filter(m => typeof m === 'number');
            const totalCohortObtained = allPublishedMarks.reduce((a, b) => a + b, 0);
            const totalCohortMax = publishedTests.reduce((sum, t) => sum + (t.maxMarks * (t.marks || []).length), 0);
            const cohortAvgOverall = totalCohortMax > 0 ? ((totalCohortObtained / totalCohortMax) * 100).toFixed(1) + '%' : 'N/A';
            document.getElementById('analyticsCohortAvg').textContent = cohortAvgOverall;
        }

        // Weak topics view
        if (weakTopicsList) {
            if (weakItems.length === 0) {
                weakTopicsList.innerHTML = `
                    <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:1rem 1.25rem; color:#166534; font-weight:600; font-size:0.9rem;">
                        ✨ Great job! You scored 60% or higher on all evaluated tests. Keep up the high standard!
                    </div>
                `;
            } else {
                weakItems.forEach(item => {
                    const row = document.createElement('div');
                    row.style.cssText = 'background: #fff; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 0.65rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;';
                    row.innerHTML = `
                        <div>
                            <span style="font-weight:700; color:#991b1b;">${window.escapeHTML(item.subject)}</span>
                            <span style="color:#64748b; font-size:0.8rem; margin-left:0.5rem;">(${DB.formatDate(item.date)})</span>
                            <div style="font-size:0.8rem; color:#64748b; margin-top:0.2rem;">Score: ${item.obtained} / ${item.max} (${item.percentage}%)</div>
                        </div>
                        <a href="study-notes.html" class="btn btn-outline" style="font-size:0.75rem; padding:0.25rem 0.65rem; border-color:#ef4444; color:#b91c1c;">
                            Review Notes &rarr;
                        </a>
                    `;
                    weakTopicsList.appendChild(row);
                });
            }
        }
    }

    // ================= 3. ONLINE ASSESSMENTS MODULE =================
    async function renderAssessments() {
        const grid = document.getElementById('availableAssessmentsGrid');
        const attemptsTableBody = document.querySelector('#assessmentAttemptsTable tbody');
        if (!grid) return;

        const allAssessments = await DB.getOnlineAssessments();
        const studentClass = (student && student.class) ? student.class.toUpperCase() : '';

        // Filter assessments matching class or 'All'
        const relevantAssessments = allAssessments.filter(a => {
            if (!a.published) return false;
            if (!a.targetClass || a.targetClass === 'All') return true;
            return a.targetClass.toUpperCase() === studentClass;
        });

        grid.innerHTML = '';
        if (relevantAssessments.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2.5rem; background: white; border-radius: 12px; color: var(--text-light);">No active online assessments available for your class at this time.</div>';
        } else {
            relevantAssessments.forEach(exam => {
                const card = document.createElement('div');
                card.className = 'assessment-card';
                card.innerHTML = `
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <span class="badge" style="background:#dbeafe; color:#1e40af; font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:99px;">${exam.subject} (Class ${exam.targetClass})</span>
                            <span style="font-size: 0.8rem; font-weight: 700; color: #d97706;">⏱️ ${exam.durationMinutes} Mins</span>
                        </div>
                        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--primary-color); margin: 0 0 0.5rem 0;">
                            ${window.escapeHTML(exam.title)}
                        </h3>
                        <div style="font-size: 0.85rem; color: var(--text-light); margin-bottom: 1.25rem;">
                            <span>Questions: ${(exam.questions || []).length}</span> &bull; 
                            <span>Total Marks: ${exam.totalMarks}</span> &bull; 
                            <span>Negative Marking: ${exam.negativeMarking ? `-${exam.negativeMarking}` : 'None'}</span>
                        </div>
                    </div>
                    <a href="online-test.html?examId=${exam.id}" class="btn btn-primary" style="text-align: center; font-weight: 700; padding: 0.65rem 1rem;">
                        Start Assessment Now &rarr;
                    </a>
                `;
                grid.appendChild(card);
            });
        }

        // Render past attempts for this student
        if (attemptsTableBody) {
            attemptsTableBody.innerHTML = '';
            let hasAttempts = false;

            allAssessments.forEach(exam => {
                const attempts = (exam.attempts || []).filter(at => at.studentId.toLowerCase() === user.id.toLowerCase());
                attempts.forEach(at => {
                    hasAttempts = true;
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="font-weight:700; color:var(--text-dark);">${window.escapeHTML(exam.title)}</td>
                        <td>${DB.formatDate(at.submittedAt)}</td>
                        <td class="text-right" style="font-weight:700;">${at.score} / ${at.totalMarks}</td>
                        <td class="text-right" style="font-weight:800; color:#16a34a;">${at.percentage}%</td>
                        <td class="text-right" style="color:#16a34a; font-weight:700;">${at.correct}</td>
                        <td class="text-right" style="color:#dc2626; font-weight:700;">${at.incorrect}</td>
                    `;
                    attemptsTableBody.appendChild(tr);
                });
            });

            if (!hasAttempts) {
                attemptsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-light);">No completed assessment attempts recorded yet.</td></tr>';
            }
        }
    }

    // ================= 4. ASSIGNMENTS MODULE =================
    async function renderAssignments() {
        const container = document.getElementById('assignmentsListContainer');
        if (!container) return;

        const assignments = await DB.getAssignments();
        const studentClass = (student && student.class) ? student.class.toUpperCase() : '';

        const relevant = assignments.filter(a => {
            if (!a.targetClass || a.targetClass === 'All') return true;
            return a.targetClass.toUpperCase() === studentClass;
        });

        container.innerHTML = '';
        if (relevant.length === 0) {
            container.innerHTML = `
                <div style="background: white; border-radius: 12px; padding: 3rem; text-align: center; border: 1.5px dashed var(--gray-300);">
                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary-color); margin: 0 0 0.5rem 0;">No Pending Assignments</h3>
                    <p style="color: var(--text-light); font-size: 0.9rem; margin: 0;">You are fully caught up on all homework assignments for your class!</p>
                </div>
            `;
            return;
        }

        relevant.forEach(asg => {
            const submissions = asg.submissions || [];
            const mySub = submissions.find(s => s.studentId.toLowerCase() === user.id.toLowerCase());
            const isSubmitted = !!mySub;

            const card = document.createElement('div');
            card.className = 'assignment-card';

            const statusBadge = isSubmitted 
                ? (mySub.grade ? `<span class="badge-reviewed">Graded: ${mySub.grade}</span>` : `<span class="badge-submitted">Submitted</span>`)
                : `<span class="badge-pending">Pending Submission</span>`;

            const resourceLinkHtml = asg.resourceLink 
                ? `<a href="${asg.resourceLink}" target="_blank" style="display:inline-flex; align-items:center; gap:0.35rem; color:var(--primary-light); font-weight:700; text-decoration:none; font-size:0.85rem; margin-top:0.75rem;">
                    📄 Attached Resource Document &rarr;
                   </a>` 
                : '';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: #1e40af; background: #dbeafe; padding: 0.2rem 0.65rem; border-radius: 99px;">
                        ${asg.subject} &bull; Class ${asg.targetClass}
                    </span>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <span style="font-size: 0.8rem; color: #b91c1c; font-weight: 700;">📅 Due: ${DB.formatDate(asg.dueDate)}</span>
                        ${statusBadge}
                    </div>
                </div>

                <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--primary-color); margin: 0 0 0.5rem 0;">
                    ${window.escapeHTML(asg.title)}
                </h3>
                <p style="font-size: 0.9rem; color: var(--text-dark); line-height: 1.6; margin: 0 0 0.75rem 0;">
                    ${window.escapeHTML(asg.description)}
                </p>

                ${resourceLinkHtml}

                <div style="border-top: 1px solid var(--gray-200); margin-top: 1.25rem; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
                    <div style="font-size: 0.8rem; color: var(--text-light);">
                        Assigned by: <strong>${window.escapeHTML(asg.createdBy || 'Teacher')}</strong>
                    </div>
                    <div>
                        ${isSubmitted ? `
                            <span style="font-size: 0.85rem; color: #166534; font-weight: 700;">
                                ✓ Submitted on ${DB.formatDate(mySub.submittedAt)}
                            </span>
                        ` : `
                            <button type="button" class="btn btn-primary submit-asg-btn" data-id="${asg.id}" data-title="${window.escapeHTML(asg.title)}" style="padding: 0.45rem 1rem; font-size: 0.85rem; font-weight: 700;">
                                Submit Assignment &rarr;
                            </button>
                        `}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Bind submission modals
        document.querySelectorAll('.submit-asg-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const asgId = btn.dataset.id;
                const asgTitle = btn.dataset.title;
                document.getElementById('modalAsgId').value = asgId;
                document.getElementById('modalAsgTitle').textContent = `Submit Work: ${asgTitle}`;
                document.getElementById('submitAssignmentModal').classList.add('open');
            });
        });
    }

    // Modal close listeners
    const asgModal = document.getElementById('submitAssignmentModal');
    const closeAsgBtn = document.getElementById('closeAsgModalBtn');
    const cancelAsgBtn = document.getElementById('cancelAsgModalBtn');
    if (closeAsgBtn) closeAsgBtn.addEventListener('click', () => asgModal.classList.remove('open'));
    if (cancelAsgBtn) cancelAsgBtn.addEventListener('click', () => asgModal.classList.remove('open'));

    const submitAsgForm = document.getElementById('submit-assignment-form');
    if (submitAsgForm) {
        submitAsgForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const asgId = document.getElementById('modalAsgId').value;
            const notes = document.getElementById('asgSubmitNotes').value.trim();
            const link = document.getElementById('asgSubmitLink').value.trim();

            if (!notes && !link) {
                alert("Please provide either your written answers or a link to your work.");
                return;
            }

            try {
                const assignments = await DB.getAssignments();
                const targetAsg = assignments.find(a => a.id === asgId);
                if (targetAsg) {
                    if (!targetAsg.submissions) targetAsg.submissions = [];
                    // Remove prior submission if any
                    targetAsg.submissions = targetAsg.submissions.filter(s => s.studentId.toLowerCase() !== user.id.toLowerCase());
                    targetAsg.submissions.push({
                        studentId: user.id,
                        studentName: user.name,
                        notes: notes,
                        link: link,
                        submittedAt: new Date().toISOString()
                    });

                    await DB.setAssignments(assignments);
                    alert("Assignment submitted successfully to your mentor!");
                    asgModal.classList.remove('open');
                    renderAssignments();
                }
            } catch (err) {
                console.error("Assignment submission failed:", err);
                alert("Could not submit assignment. Please check connection.");
            }
        });
    }

    // ================= 5. ATTENDANCE CALENDAR =================
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
                const status = day.records[user.id];
                if (status === 'present') presentDays++;
                attendanceMap[day.date] = {
                    status: status,
                    takenBy: day.takenBy || 'Teacher'
                };
            }
        });

        let attendancePct = '0%';
        if (totalDays === 0) {
            attendanceRateEl.textContent = 'N/A';
        } else {
            attendancePct = ((presentDays / totalDays) * 100).toFixed(1) + '%';
            attendanceRateEl.textContent = attendancePct;
            attendanceRateEl.style.color = (presentDays / totalDays) >= 0.75 ? '#166534' : '#b91c1c';
        }

        function drawCalendar() {
            if (!calendarDaysGrid || !calendarMonthTitle) return;

            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            calendarMonthTitle.textContent = `${monthNames[month]} ${year}`;
            calendarDaysGrid.innerHTML = '';

            const firstDayIndex = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            for (let i = 0; i < firstDayIndex; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.style.padding = '0.4rem';
                calendarDaysGrid.appendChild(emptyCell);
            }

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
                    cursor: default;
                `;

                if (rec) {
                    if (rec.status === 'present') {
                        circle.style.background = '#dcfce7';
                        circle.style.color = '#15803d';
                        circle.style.border = '1.5px solid #22c55e';
                        circle.title = `${dateStr}: PRESENT (${rec.takenBy})`;
                    } else {
                        circle.style.background = '#fee2e2';
                        circle.style.color = '#b91c1c';
                        circle.style.border = '1.5px solid #ef4444';
                        circle.title = `${dateStr}: ABSENT (${rec.takenBy})`;
                    }
                } else {
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

    // ================= 6. LECTURE & VIDEO PROGRESS =================
    async function renderLectureProgress() {
        const sectionsContainer = document.getElementById('lectureSectionsContainer');
        const overallProgressText = document.getElementById('overallLectureProgress');
        const progressBar = document.getElementById('lectureProgressBar');
        if (!sectionsContainer) return;

        try {
            const lectures = await DB.getVideoLectures();
            const permissions = (student && student.lecturePermissions) || [];
            const accessibleSections = lectures.filter(l => permissions.includes(l.id));

            if (accessibleSections.length === 0) {
                sectionsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light); font-weight: 500;">No video lectures are currently enabled for your account. Please consult with Teacher Shneh Rawat.</div>';
                overallProgressText.textContent = '0 / 0 Completed (0% Done)';
                progressBar.style.width = '0%';
                return;
            }

            let completedSet = new Set((student && student.completedLectures) || []);
            let rewardedSet = new Set((student && student.rewardedLectures) || []);
            let totalVideos = 0;
            let completedVideos = 0;

            accessibleSections.forEach(section => {
                (section.videos || []).forEach(video => {
                    totalVideos++;
                    const videoKey = `${section.id}::${video.title}`;
                    if (completedSet.has(videoKey)) completedVideos++;
                });
            });

            const overallPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
            overallProgressText.textContent = `${completedVideos} / ${totalVideos} Completed (${overallPercent}% Done)`;
            progressBar.style.width = `${overallPercent}%`;

            sectionsContainer.innerHTML = '';

            accessibleSections.forEach(section => {
                const videos = section.videos || [];
                let secCompleted = 0;

                const videoRowsHtml = videos.map((video, idx) => {
                    const videoKey = `${section.id}::${video.title}`;
                    const isCompleted = completedSet.has(videoKey);
                    if (isCompleted) secCompleted++;

                    const watchBtnHtml = video.link 
                        ? `<a href="${video.link}" target="_blank" class="btn-watch">▶ Watch</a>`
                        : `<span style="font-size:0.8rem; color:var(--text-light);">(No Link)</span>`;

                    return `
                        <div class="video-row" data-video-key="${videoKey}">
                            <label class="video-left" style="cursor: pointer;">
                                <input type="checkbox" class="video-checkbox" data-video-key="${videoKey}" ${isCompleted ? 'checked disabled' : ''} style="width:18px; height:18px; accent-color:#16a34a; cursor:pointer;" />
                                <span style="font-weight:600; color:var(--text-dark); ${isCompleted ? 'color:#15803d;' : ''}">${window.escapeHTML(video.title || `Lecture ${idx + 1}`)}</span>
                                ${isCompleted ? '<span style="font-size:0.75rem; color:#166534; font-weight:700; background:#dcfce7; padding:0.15rem 0.5rem; border-radius:99px;">🔒 Watched (+10 Coins)</span>' : ''}
                            </label>
                            <div>${watchBtnHtml}</div>
                        </div>
                    `;
                }).join('');

                const secPercent = videos.length > 0 ? Math.round((secCompleted / videos.length) * 100) : 0;

                const sectionEl = document.createElement('div');
                sectionEl.className = 'lecture-section';
                sectionEl.id = `section-${section.id}`;
                sectionEl.innerHTML = `
                    <button class="lecture-section-header">
                        <span class="lecture-section-title">
                            📚 ${window.escapeHTML(section.title)}
                        </span>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--primary-color); background:#dbeafe; padding:0.2rem 0.6rem; border-radius:99px;">${secCompleted} / ${videos.length} Done (${secPercent}%)</span>
                            <span class="lecture-section-arrow" style="font-size:0.8rem;">▼</span>
                        </div>
                    </button>
                    <div class="lecture-section-content">
                        ${videoRowsHtml}
                    </div>
                `;

                const header = sectionEl.querySelector('.lecture-section-header');
                const content = sectionEl.querySelector('.lecture-section-content');
                header.addEventListener('click', () => {
                    const isOpen = sectionEl.classList.toggle('active');
                    content.style.height = isOpen ? 'auto' : '0';
                });

                sectionsContainer.appendChild(sectionEl);
            });

            // Checkbox change listener
            sectionsContainer.addEventListener('change', async (e) => {
                if (e.target.classList.contains('video-checkbox')) {
                    const cb = e.target;
                    const key = cb.getAttribute('data-video-key');

                    if (!cb.checked) {
                        cb.checked = true;
                        return;
                    }

                    cb.disabled = true;
                    completedSet.add(key);

                    let newlyAwarded = false;
                    if (!rewardedSet.has(key)) {
                        rewardedSet.add(key);
                        newlyAwarded = true;
                    }

                    try {
                        const allStudents = await DB.getStudents();
                        const sIdx = allStudents.findIndex(s => s.id.toLowerCase() === user.id.toLowerCase());
                        if (sIdx !== -1) {
                            allStudents[sIdx].completedLectures = Array.from(completedSet);
                            allStudents[sIdx].rewardedLectures = Array.from(rewardedSet);
                            if (newlyAwarded) {
                                allStudents[sIdx].coins = (allStudents[sIdx].coins || 0) + 10;
                                const currentCoins = allStudents[sIdx].coins;
                                if (studentCoinsEl) studentCoinsEl.textContent = `${currentCoins.toLocaleString('en-IN')}`;
                                alert(`🎉 +10 Coins Awarded for completing topic! Total: ${currentCoins} Coins`);
                            }
                            await DB.setStudents(allStudents);
                            renderLectureProgress();
                        }
                    } catch (err) {
                        console.error("Coin sync error:", err);
                    }
                }
            });

        } catch (e) {
            console.error("Lecture render error:", e);
        }
    }

    // ================= 7. TEACHER & ADMIN NOTES =================
    async function renderStudentNotes() {
        const container = document.getElementById('studentNotesContainer');
        if (!container) return;

        const notes = (student && student.notes) || [];
        if (notes.length === 0) {
            container.innerHTML = `
                <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 1.25rem; text-align: center; color: var(--text-light);">
                    <p style="margin: 0; font-size: 0.9rem; font-weight: 500;">No personalized notes or announcements posted for you yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        const sorted = [...notes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        sorted.forEach(note => {
            const card = document.createElement('div');
            card.style.cssText = 'background: white; border: 1px solid #e2e8f0; border-left: 4px solid #2563eb; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 0.85rem; box-shadow: 0 2px 6px rgba(0,0,0,0.02);';
            
            const isTeacher = note.authorRole === 'teacher';
            const badge = isTeacher 
                ? `<span style="background:#dcfce7; color:#166534; font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:99px;">Teacher (${window.escapeHTML(note.authorName || 'Teacher')})</span>`
                : `<span style="background:#dbeafe; color:#1e40af; font-size:0.75rem; font-weight:700; padding:0.2rem 0.6rem; border-radius:99px;">Super Admin</span>`;

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                    <div>${badge}</div>
                    <div style="font-size:0.8rem; color:var(--text-light); font-weight:600;">📅 ${note.date || DB.formatDate(note.createdAt)}</div>
                </div>
                <div style="font-size:0.95rem; color:var(--text-dark); line-height:1.6; white-space:pre-wrap;">
                    ${window.escapeHTML(note.text)}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ================= 8. PROFILE & PASSWORD =================
    function renderProfile() {
        const list = document.getElementById('profileDetailsList');
        if (!list || !student) return;

        list.innerHTML = `
            <div><strong>Full Name:</strong> ${window.escapeHTML(student.name)}</div>
            <div><strong>Student ID:</strong> ${student.id}</div>
            <div><strong>Enrolled Class:</strong> Class ${student.class || 'N/A'}</div>
            <div><strong>Date of Joining:</strong> ${DB.formatDate(student.dateOfJoining) || 'N/A'}</div>
            <div><strong>Father's Contact:</strong> ${student.fatherPhone || 'Not recorded'}</div>
            <div><strong>Mother's Contact:</strong> ${student.motherPhone || 'Not recorded'}</div>
            <div><strong>Personal Contact:</strong> ${student.personalPhone || 'Not recorded'}</div>
            <div><strong>Monthly Base Fee:</strong> ₹${(student.fees || 0).toLocaleString('en-IN')}</div>
        `;
    }

    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value.trim();
            if (!newPassword || newPassword.length < 4) {
                alert("Password must be at least 4 characters long.");
                return;
            }

            try {
                let allStudents = await DB.getStudents();
                let idx = allStudents.findIndex(s => s.id.toLowerCase() === user.id.toLowerCase());
                if (idx !== -1) {
                    allStudents[idx].password = newPassword;
                    await DB.setStudents(allStudents);
                    alert("Password updated successfully! Please login with your new credentials.");
                    DB.logout();
                    window.location.href = 'login.html';
                }
            } catch (err) {
                alert("Error updating password: " + err.message);
            }
        });
    }

    // ================= 9. PRINTABLE REPORT CARD GENERATOR =================
    const reportCardModal = document.getElementById('reportCardModal');
    const openReportCardBtn = document.getElementById('openReportCardBtn');
    const closeReportCardBtn = document.getElementById('closeReportCardBtn');

    if (openReportCardBtn) {
        openReportCardBtn.addEventListener('click', () => {
            if (!student) return;

            document.getElementById('rcStudentName').textContent = student.name;
            document.getElementById('rcStudentClass').textContent = `Class ${student.class || 'N/A'}`;
            document.getElementById('rcStudentId').textContent = student.id;
            document.getElementById('rcDate').textContent = DB.formatDate(new Date().toISOString());
            document.getElementById('rcAttendanceRate').textContent = attendanceRateEl ? attendanceRateEl.textContent : 'N/A';
            document.getElementById('rcCumulative').textContent = `${studentCumulativePct}%`;

            const rcTableBody = document.querySelector('#rcTable tbody');
            rcTableBody.innerHTML = '';

            if (studentResultsList.length === 0) {
                rcTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">No published test records yet.</td></tr>';
            } else {
                studentResultsList.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${DB.formatDate(item.date)}</td>
                        <td style="font-weight:700;">${window.escapeHTML(item.subject)}</td>
                        <td class="text-right">${item.max}</td>
                        <td class="text-right" style="font-weight:700;">${item.mark}</td>
                        <td class="text-right" style="font-weight:800; color:#1e40af;">${item.percentage}%</td>
                    `;
                    rcTableBody.appendChild(tr);
                });
            }

            reportCardModal.classList.add('open');
        });
    }

    if (closeReportCardBtn) {
        closeReportCardBtn.addEventListener('click', () => reportCardModal.classList.remove('open'));
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            DB.logout();
            window.location.href = 'index.html';
        });
    }

    // Initialize all components
    await renderFees();
    await renderResultsAndAnalytics();
    await renderAssessments();
    await renderAssignments();
    await renderAttendance();
    await renderLectureProgress();
    await renderStudentNotes();
    renderProfile();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStudentDashboard);
} else {
    initStudentDashboard();
}
