function getInitials(name) {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function initLeaderboard() {
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    const navCtaBtn = document.getElementById('navCtaBtn');
    const mobileCtaBtn = document.getElementById('mobileCtaBtn');

    if (user) {
        const dashboardUrl = user.role === 'teacher' ? 'teacher-dashboard.html' :
            (user.role === 'admin' ? 'admin-dashboard.html' : 'student-dashboard.html');
        if (navCtaBtn) {
            navCtaBtn.textContent = 'DASHBOARD';
            navCtaBtn.href = dashboardUrl;
        }
        if (mobileCtaBtn) {
            mobileCtaBtn.textContent = 'DASHBOARD';
            mobileCtaBtn.href = dashboardUrl;
        }
    }

    const podiumContainer = document.getElementById('podiumContainer');
    const leaderboardTbody = document.getElementById('leaderboardTbody');
    const searchInput = document.getElementById('searchStudentInput');
    const filterTabs = document.querySelectorAll('.filter-tab');

    const totalStudentsEl = document.getElementById('totalStudentsStat');
    const totalLecturesEl = document.getElementById('totalLecturesStat');
    const totalCoinsEl = document.getElementById('totalCoinsStat');

    const userRankBanner = document.getElementById('userRankBanner');
    const userAvatarInitials = document.getElementById('userAvatarInitials');
    const userRankTitle = document.getElementById('userRankTitle');
    const userRankSubText = document.getElementById('userRankSubText');
    const userRankBadge = document.getElementById('userRankBadge');
    const userCoinsBadge = document.getElementById('userCoinsBadge');
    const userLecturesBadge = document.getElementById('userLecturesBadge');

    let currentFilter = 'all';

    try {
        const rawStudents = await DB.getStudents();
        if (!rawStudents || rawStudents.length === 0) {
            if (podiumContainer) podiumContainer.innerHTML = '';
            if (leaderboardTbody) leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 2.5rem;">No student rankings recorded yet.</td></tr>';
            return;
        }

        // Sort students by coins descending, then completed lectures count descending
        const sortedStudents = [...rawStudents].sort((a, b) => {
            const coinsA = a.coins || 0;
            const coinsB = b.coins || 0;
            if (coinsB !== coinsA) return coinsB - coinsA;
            const lecA = (a.completedLectures || []).length;
            const lecB = (b.completedLectures || []).length;
            return lecB - lecA;
        });

        // Compute Overview Stats
        const totalStudents = sortedStudents.length;
        let totalLectures = 0;
        let totalCoins = 0;
        sortedStudents.forEach(s => {
            totalLectures += (s.completedLectures || []).length;
            totalCoins += (s.coins || 0);
        });

        if (totalStudentsEl) totalStudentsEl.textContent = totalStudents.toLocaleString('en-IN');
        if (totalLecturesEl) totalLecturesEl.textContent = totalLectures.toLocaleString('en-IN');
        if (totalCoinsEl) totalCoinsEl.textContent = totalCoins.toLocaleString('en-IN');

        // Personal Rank Banner for Logged-In Student
        if (user && user.role === 'student') {
            const userIndex = sortedStudents.findIndex(s => s.id.toLowerCase() === user.id.toLowerCase());
            if (userIndex !== -1) {
                const userStudent = sortedStudents[userIndex];
                if (userRankBanner) userRankBanner.style.display = 'flex';
                if (userAvatarInitials) userAvatarInitials.textContent = getInitials(userStudent.name);
                if (userRankTitle) userRankTitle.textContent = `${userStudent.name}`;
                if (userRankSubText) {
                    if (userIndex === 0) {
                        userRankSubText.textContent = `👑 Congratulations! You are Rank #1 on the leaderboard.`;
                    } else {
                        const aheadStudent = sortedStudents[userIndex - 1];
                        const gap = (aheadStudent.coins || 0) - (userStudent.coins || 0);
                        userRankSubText.textContent = gap > 0 ? `${gap} coins behind Rank #${userIndex}. Keep going!` : `You are on Rank #${userIndex + 1}.`;
                    }
                }
                if (userRankBadge) userRankBadge.textContent = `Rank #${userIndex + 1}`;
                if (userCoinsBadge) userCoinsBadge.textContent = `${(userStudent.coins || 0).toLocaleString('en-IN')} Coins`;
                if (userLecturesBadge) userLecturesBadge.textContent = `${(userStudent.completedLectures || []).length} Lectures`;
            }
        }

        // Render Podium for Top 3
        if (podiumContainer) {
            podiumContainer.innerHTML = '';
            const top3 = sortedStudents.slice(0, 3);
            
            const first = top3[0];
            const second = top3[1];
            const third = top3[2];

            let podiumHtml = '';

            if (second) {
                podiumHtml += `
                    <div class="podium-card second">
                        <div class="podium-avatar-wrapper">
                            <span class="crown-tag">2ND PLACE</span>
                            <div class="avatar-circle">${getInitials(second.name)}</div>
                        </div>
                        <div class="podium-name">${second.name}</div>
                        <div class="podium-class">${second.class || 'Class N/A'}</div>
                        <div class="podium-coins-badge">${(second.coins || 0).toLocaleString('en-IN')} Coins</div>
                        <div class="podium-lectures-count">${(second.completedLectures || []).length} Lectures Completed</div>
                    </div>
                `;
            }

            if (first) {
                podiumHtml += `
                    <div class="podium-card first">
                        <div class="podium-avatar-wrapper">
                            <span class="crown-tag">1ST WINNER</span>
                            <div class="avatar-circle">${getInitials(first.name)}</div>
                        </div>
                        <div class="podium-name">${first.name}</div>
                        <div class="podium-class">${first.class || 'Class N/A'}</div>
                        <div class="podium-coins-badge">${(first.coins || 0).toLocaleString('en-IN')} Coins</div>
                        <div class="podium-lectures-count">${(first.completedLectures || []).length} Lectures Completed</div>
                    </div>
                `;
            }

            if (third) {
                podiumHtml += `
                    <div class="podium-card third">
                        <div class="podium-avatar-wrapper">
                            <span class="crown-tag">3RD PLACE</span>
                            <div class="avatar-circle">${getInitials(third.name)}</div>
                        </div>
                        <div class="podium-name">${third.name}</div>
                        <div class="podium-class">${third.class || 'Class N/A'}</div>
                        <div class="podium-coins-badge">${(third.coins || 0).toLocaleString('en-IN')} Coins</div>
                        <div class="podium-lectures-count">${(third.completedLectures || []).length} Lectures Completed</div>
                    </div>
                `;
            }

            podiumContainer.innerHTML = podiumHtml;
        }

        // Render Table Function
        function renderTable(filterQuery = '') {
            if (!leaderboardTbody) return;
            leaderboardTbody.innerHTML = '';

            let list = [...sortedStudents];
            if (currentFilter === 'top10') {
                list = list.slice(0, 10);
            }

            const q = filterQuery.toLowerCase().trim();
            if (q) {
                list = list.filter(s => s.name.toLowerCase().includes(q) || (s.class || '').toLowerCase().includes(q));
            }

            if (list.length === 0) {
                leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-light); padding: 2.5rem;">No matching students found.</td></tr>';
                return;
            }

            // Max lectures found for progress bar scale
            const maxLecs = Math.max(1, ...sortedStudents.map(s => (s.completedLectures || []).length));

            list.forEach(student => {
                const rankIndex = sortedStudents.findIndex(s => s.id === student.id) + 1;
                const isCurrentUser = user && user.id && user.id.toLowerCase() === student.id.toLowerCase();
                const rankClass = rankIndex === 1 ? 'top-1' : (rankIndex === 2 ? 'top-2' : (rankIndex === 3 ? 'top-3' : ''));
                const lecturesCount = (student.completedLectures || []).length;
                const coinsCount = (student.coins || 0);
                const progressPct = Math.round((lecturesCount / maxLecs) * 100);

                const safeName = window.escapeHTML ? window.escapeHTML(student.name) : student.name;
                const safeClass = window.escapeHTML ? window.escapeHTML(student.class || 'N/A') : (student.class || 'N/A');

                const tr = document.createElement('tr');
                if (isCurrentUser) tr.className = 'my-rank-row';

                tr.innerHTML = `
                    <td style="text-align: center;">
                        <span class="rank-badge ${rankClass}">${rankIndex}</span>
                    </td>
                    <td>
                        <div style="display: flex; align-items: center;">
                            <div class="table-avatar-initials">${getInitials(student.name)}</div>
                            <div>
                                <strong style="color: var(--text-dark); font-size: 0.95rem;">${safeName}</strong>
                                ${isCurrentUser ? '<span class="badge badge-success" style="margin-left: 0.5rem; background:#dcfce7; color:#166534; font-size: 0.7rem; font-weight:700;">YOU</span>' : ''}
                            </div>
                        </div>
                    </td>
                    <td><span class="badge" style="background:#f1f5f9; color:#475569; font-weight:600;">${safeClass}</span></td>
                    <td>
                        <span style="font-weight: 600;">${lecturesCount}</span>
                        <div class="lecture-progress-bar-container">
                            <div class="lecture-progress-fill" style="width: ${progressPct}%;"></div>
                        </div>
                    </td>
                    <td class="text-right">
                        <span class="badge" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-weight: 800; font-size: 0.9rem; padding: 0.3rem 0.75rem;">${coinsCount.toLocaleString('en-IN')} Coins</span>
                    </td>
                `;

                leaderboardTbody.appendChild(tr);
            });
        }

        renderTable();

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                renderTable(e.target.value);
            });
        }

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentFilter = tab.dataset.filter || 'all';
                renderTable(searchInput ? searchInput.value : '');
            });
        });

    } catch (e) {
        console.error("Error loading leaderboard:", e);
        if (leaderboardTbody) {
            leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #dc2626; padding: 2.5rem;">Error loading leaderboard data. Please refresh.</td></tr>';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeaderboard);
} else {
    initLeaderboard();
}
