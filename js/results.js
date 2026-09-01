document.addEventListener('DOMContentLoaded', async () => {
    const user = typeof DB !== 'undefined' ? DB.getCurrentUser() : null;
    if (!user) {
        alert("Please login to view Test Results & Batch Leaderboards.");
        window.location.href = 'login.html';
        return;
    }

    const batchTabsContainer = document.getElementById('batchTabs');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const sortOrderBtn = document.getElementById('sortOrderBtn');
    const sortOrderLabel = document.getElementById('sortOrderLabel');
    const sortOrderIcon = document.getElementById('sortOrderIcon');
    const resultsContent = document.getElementById('resultsContent');

    // App State
    let activeBatch = 'ALL';
    let sortBy = 'cumulative'; // 'cumulative', 'name', or 'test_<testId>'
    let sortOrder = 'desc'; // 'desc' or 'asc'
    let searchQuery = '';

    // Data Cache
    let allTests = [];
    let allStudents = [];
    let publishedTests = [];

    async function loadData() {
        allTests = await DB.getTests();
        allStudents = await DB.getStudents();
        publishedTests = allTests.filter(t => t.published);
        renderBatchTabs();
        renderResults();
    }

    function getUniqueBatches() {
        const batchSet = new Set();
        
        // Add classes from active students
        allStudents.forEach(s => {
            if (s.class && s.class.trim()) {
                batchSet.add(s.class.trim().toUpperCase());
            }
        });

        // Add target classes from tests
        publishedTests.forEach(t => {
            if (t.targetClass && t.targetClass !== 'All') {
                batchSet.add(t.targetClass.trim().toUpperCase());
            }
        });

        const sorted = Array.from(batchSet).sort((a, b) => {
            if (a === 'NDA') return -1;
            if (b === 'NDA') return 1;
            return a.localeCompare(b, undefined, { numeric: true });
        });

        return ['ALL', ...sorted];
    }

    function renderBatchTabs() {
        if (!batchTabsContainer) return;
        const batches = getUniqueBatches();
        batchTabsContainer.innerHTML = '';

        batches.forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isNda = b === 'NDA';
            btn.className = `batch-tab ${isNda ? 'nda-tab' : ''} ${activeBatch === b ? 'active' : ''}`;
            
            let icon = '🎓';
            if (b === 'ALL') icon = '📋';
            else if (isNda) icon = '🎖️';
            
            let label = b === 'ALL' ? 'All Batches' : (isNda ? 'NDA Batch' : `Class ${b}`);
            btn.innerHTML = `<span>${icon}</span> <span>${label}</span>`;

            btn.addEventListener('click', () => {
                activeBatch = b;
                document.querySelectorAll('.batch-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                renderResults();
            });

            batchTabsContainer.appendChild(btn);
        });
    }

    function updateSortDropdown(testList) {
        if (!sortSelect) return;
        const currentVal = sortSelect.value;
        
        sortSelect.innerHTML = `
            <option value="cumulative">Cumulative %</option>
            <option value="name">Student Name</option>
        `;

        if (testList && testList.length > 0) {
            const group = document.createElement('optgroup');
            group.label = "Individual Tests";
            testList.forEach(t => {
                const opt = document.createElement('option');
                opt.value = `test_${t.id}`;
                opt.textContent = `${t.subject} (${t.maxMarks}m)`;
                group.appendChild(opt);
            });
            sortSelect.appendChild(group);
        }

        if (Array.from(sortSelect.options).some(o => o.value === currentVal)) {
            sortSelect.value = currentVal;
        } else {
            sortSelect.value = 'cumulative';
            sortBy = 'cumulative';
        }
    }

    function renderResults() {
        if (!resultsContent) return;

        if (publishedTests.length === 0) {
            resultsContent.innerHTML = `
                <div style="text-align: center; color: var(--text-light); padding: 5rem 1rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                    <h2 style="font-weight: 700; color: #1e293b;">No test results published yet</h2>
                    <p style="color: #64748b; max-width: 400px; margin: 0.5rem auto 0;">Check back soon! Test scores will appear here once published by teachers.</p>
                </div>
            `;
            return;
        }

        const uniqueBatches = getUniqueBatches().filter(b => b !== 'ALL');
        const displayBatches = activeBatch === 'ALL' ? uniqueBatches : [activeBatch];

        resultsContent.innerHTML = '';
        let totalCardsRendered = 0;

        displayBatches.forEach(batchKey => {
            // Filter tests relevant to this batch
            const batchTests = publishedTests.filter(t => {
                if (!t.targetClass || t.targetClass === 'All') return true;
                return t.targetClass.trim().toUpperCase() === batchKey;
            });

            // Filter students belonging to this batch
            const batchStudents = allStudents.filter(s => (s.class || '').trim().toUpperCase() === batchKey);

            if (batchStudents.length === 0 && batchTests.length === 0) return;

            // Build student statistics for this batch
            const studentStats = {};
            batchStudents.forEach(s => {
                studentStats[s.id] = {
                    id: s.id,
                    name: s.name,
                    classStr: s.class || batchKey,
                    testMarks: {},
                    totalMax: 0,
                    totalObtained: 0,
                };
            });

            // Tally marks for published tests for this batch
            batchTests.forEach(test => {
                test.marks.forEach(m => {
                    // If student is in this batch or if in ALL mode
                    let s = studentStats[m.studentId];
                    if (!s) {
                        // Student might exist in allStudents
                        const foundStudent = allStudents.find(st => st.id === m.studentId);
                        if (foundStudent && (foundStudent.class || '').trim().toUpperCase() === batchKey) {
                            studentStats[m.studentId] = {
                                id: foundStudent.id,
                                name: foundStudent.name,
                                classStr: foundStudent.class || batchKey,
                                testMarks: {},
                                totalMax: 0,
                                totalObtained: 0,
                            };
                            s = studentStats[m.studentId];
                        }
                    }

                    if (s) {
                        s.testMarks[test.id] = m.mark;
                        s.totalMax += test.maxMarks;
                        s.totalObtained += m.mark;
                    }
                });
            });

            // Convert to array and filter students who participated in at least one test or exist in batch
            let studentList = Object.values(studentStats).filter(s => {
                if (s.totalMax > 0) {
                    s.cumulativePercentage = (s.totalObtained / s.totalMax) * 100;
                    return true;
                }
                return false;
            });

            // Apply search query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                studentList = studentList.filter(s => 
                    s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
                );
            }

            // Apply Sorting
            studentList.sort((a, b) => {
                let comp = 0;
                if (sortBy === 'name') {
                    comp = a.name.localeCompare(b.name);
                } else if (sortBy.startsWith('test_')) {
                    const testId = parseInt(sortBy.replace('test_', ''));
                    const markA = a.testMarks[testId] !== undefined ? a.testMarks[testId] : -1;
                    const markB = b.testMarks[testId] !== undefined ? b.testMarks[testId] : -1;
                    comp = markA - markB;
                } else {
                    // Default cumulative percentage
                    comp = a.cumulativePercentage - b.cumulativePercentage;
                }

                return sortOrder === 'desc' ? -comp : comp;
            });

            if (batchTests.length === 0 || studentList.length === 0) return;

            totalCardsRendered++;

            // Update global sort options with available tests
            if (activeBatch === batchKey) {
                updateSortDropdown(batchTests);
            }

            // Build Batch Card HTML
            const isNda = batchKey === 'NDA';
            const cardEl = document.createElement('div');
            cardEl.className = 'batch-card';
            if (isNda) {
                cardEl.style.border = '2px solid #f59e0b';
            }

            // Build Table Header
            let dateRow = '<th colspan="2" style="border-top-left-radius: 12px; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"><svg style="width: 14px; height: 14px; display: inline; margin-bottom: -2px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Date</th>';
            let maxMarksRow = '<th colspan="2" style="padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"><svg style="width: 14px; height: 14px; display: inline; margin-bottom: -2px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Max Marks</th>';
            
            const isNameSorted = sortBy === 'name';
            const nameIndicator = isNameSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '';
            
            let nameRow = `<th class="sortable-th" onclick="window.triggerSort('name')" style="padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.05rem; font-weight: 700;">Student Name <span class="sort-indicator">${nameIndicator}</span></th><th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--text-light); text-align: center; font-size: 0.95rem; font-weight: 700; width: 90px;">Class</th>`;

            batchTests.forEach(test => {
                dateRow += `<th style="text-align: center; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 500;">${test.date}</th>`;
                maxMarksRow += `<th style="text-align: center; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.8rem; font-weight: 500;">${test.maxMarks}</th>`;
                
                const isTestSorted = sortBy === `test_${test.id}`;
                const testIndicator = isTestSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '';
                nameRow += `<th class="sortable-th" onclick="window.triggerSort('test_${test.id}')" style="text-align: center; padding: 1rem; border-bottom: 2px solid var(--primary-color); color: #0f172a; font-size: 1.05rem; font-weight: 700; min-width: 120px;" title="Click to sort by this test">${test.subject} <span class="sort-indicator">${testIndicator}</span></th>`;
            });

            const isCumSorted = sortBy === 'cumulative';
            const cumIndicator = isCumSorted ? (sortOrder === 'asc' ? '▲' : '▼') : '';

            dateRow += '<th style="text-align: center; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; border-top-right-radius: 12px; background: #fafafa;"></th>'; 
            maxMarksRow += '<th style="text-align: center; padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; background: #fafafa;"></th>'; 
            nameRow += `<th class="sortable-th" onclick="window.triggerSort('cumulative')" style="text-align: center; padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.05rem; font-weight: 700; background: #fafafa; min-width: 140px;" title="Click to sort by Cumulative %">Cumulative % <span class="sort-indicator">${cumIndicator}</span></th>`;

            // Build Data Rows
            let dataRowsHtml = '';
            studentList.forEach((student, index) => {
                const rank = index + 1;
                let rankBadge = '';
                
                if (rank === 1) {
                    rankBadge = `<span style="background: linear-gradient(135deg, #ffd700, #daa520); color: white; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 10px; min-width:55px; text-align:center; box-shadow: 0 2px 4px rgba(218,165,32,0.4); display:inline-block;">🥇 1st</span>`;
                } else if (rank === 2) {
                    rankBadge = `<span style="background: linear-gradient(135deg, #e0e0e0, #9e9e9e); color: white; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 10px; min-width:55px; text-align:center; box-shadow: 0 2px 4px rgba(158,158,158,0.4); display:inline-block;">🥈 2nd</span>`;
                } else if (rank === 3) {
                    rankBadge = `<span style="background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 10px; min-width:55px; text-align:center; box-shadow: 0 2px 4px rgba(139,69,19,0.4); display:inline-block;">🥉 3rd</span>`;
                } else {
                    rankBadge = `<span style="background: #f1f5f9; color: #64748b; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 10px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); min-width:55px; text-align:center; display:inline-block;">#${rank}</span>`;
                }

                let rowVars = `<td style="padding: 1rem; border-bottom: 1px solid #f1f5f9;"><div style="display: flex; align-items: center;">${rankBadge}<span style="font-weight: 600; color: #1e293b; font-size: 1.05rem;">${student.name}</span></div></td>`;
                rowVars += `<td style="text-align: center; padding: 1rem; border-bottom: 1px solid #f1f5f9;"><span style="background: #e2e8f0; color: #475569; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700;">${student.classStr}</span></td>`;
                
                batchTests.forEach(test => {
                    const mark = student.testMarks[test.id];
                    if (mark !== undefined) {
                        rowVars += `<td style="text-align: center; padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 1rem;"><span style="background: #f0fdf4; color: #15803d; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 700; border: 1px solid #bbf7d0;">${mark}</span></td>`;
                    } else {
                        rowVars += `<td style="text-align: center; padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #cbd5e1; font-weight: 500;">-</td>`;
                    }
                });

                const cumScore = student.cumulativePercentage;
                let cumColor = cumScore >= 80 ? '#15803d' : (cumScore >= 50 ? '#b45309' : '#b91c1c');
                let cumBg = cumScore >= 80 ? '#f0fdf4' : (cumScore >= 50 ? '#fffbeb' : '#fef2f2');
                let cumBorder = cumScore >= 80 ? '#bbf7d0' : (cumScore >= 50 ? '#fde68a' : '#fecaca');
                
                rowVars += `<td style="text-align: center; padding: 1rem; border-bottom: 1px solid #f1f5f9; background: #fafafa;"><span style="font-weight: 800; color: ${cumColor}; background: ${cumBg}; padding: 0.45rem 0.9rem; border-radius: 8px; font-size: 1.05rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid ${cumBorder};">${cumScore.toFixed(1)}%</span></td>`;
                dataRowsHtml += `<tr style="transition: background-color 0.15s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">${rowVars}</tr>`;
            });

            const batchHeaderTitle = isNda ? '🎖️ NDA Batch Leaderboard' : `📚 Class ${batchKey} Results`;
            const headerBg = isNda ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(to right, #ffffff, #f8fafc)';
            const headerBorder = isNda ? '#f59e0b' : '#e2e8f0';

            cardEl.innerHTML = `
                <div class="batch-header" style="background: ${headerBg}; border-bottom-color: ${headerBorder};">
                    <h2 class="batch-title" style="${isNda ? 'color: #92400e;' : ''}">${batchHeaderTitle}</h2>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <span class="batch-meta">${studentList.length} Students</span>
                        <span class="batch-meta" style="background: #eff6ff; color: #1e40af; border-color: #bfdbfe;">${batchTests.length} Tests</span>
                    </div>
                </div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; min-width: 750px; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="background: #ffffff;">${dateRow}</tr>
                            <tr style="background: #ffffff;">${maxMarksRow}</tr>
                            <tr style="background: #f8fafc;">${nameRow}</tr>
                        </thead>
                        <tbody>
                            ${dataRowsHtml}
                        </tbody>
                    </table>
                </div>
            `;

            resultsContent.appendChild(cardEl);
        });

        if (totalCardsRendered === 0) {
            resultsContent.innerHTML = `
                <div style="text-align: center; color: var(--text-light); padding: 4rem 1rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 2.5rem; margin-bottom: 1rem;">🔍</div>
                    <h3 style="font-weight: 700; color: #1e293b;">No student results found</h3>
                    <p style="color: #64748b; margin-top: 0.25rem;">Try selecting a different batch filter or clear your search query.</p>
                </div>
            `;
        }
    }

    // Global Window Action for direct column click sorting
    window.triggerSort = (field) => {
        if (sortBy === field) {
            // Toggle order
            sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        } else {
            sortBy = field;
            sortOrder = 'desc';
        }

        if (sortSelect) sortSelect.value = sortBy;
        updateSortOrderBtnUI();
        renderResults();
    };

    function updateSortOrderBtnUI() {
        if (sortOrderLabel && sortOrderIcon) {
            if (sortOrder === 'desc') {
                sortOrderLabel.textContent = 'Descending';
                sortOrderIcon.textContent = '⬇';
            } else {
                sortOrderLabel.textContent = 'Ascending';
                sortOrderIcon.textContent = '⬆';
            }
        }
    }

    // Event Listeners for Filters & Sorting Controls
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.trim();
            renderResults();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            sortBy = e.target.value;
            renderResults();
        });
    }

    if (sortOrderBtn) {
        sortOrderBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
            updateSortOrderBtnUI();
            renderResults();
        });
    }

    await loadData();
});
