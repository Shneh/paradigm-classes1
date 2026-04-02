document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('resultsContainer');
    
    async function renderPublicResults() {
        const tests = await DB.getTests();
        const students = await DB.getStudents();
        const publishedTests = tests.filter(t => t.published);

        if (publishedTests.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 4rem;"><h2>No results published yet.</h2></div>';
            return;
        }

        resultsContainer.innerHTML = '';

        // Calculate cumulative percentages for all students
        const studentStats = {};
        
        students.forEach(student => {
            studentStats[student.id] = {
                name: student.name,
                classStr: student.class || '-',
                testMarks: {},
                totalMax: 0,
                totalObtained: 0,
            };
        });

        // Tally marks
        publishedTests.forEach(test => {
            test.marks.forEach(m => {
                const s = studentStats[m.studentId];
                if (s) {
                    s.testMarks[test.id] = m.mark;
                    s.totalMax += test.maxMarks;
                    s.totalObtained += m.mark;
                }
            });
        });

        // Compute cumulative percentage and convert to array
        const studentList = Object.values(studentStats)
            .filter(s => s.totalMax > 0) // only include students who exist in at least one published test
            .map(s => {
                s.cumulativePercentage = ((s.totalObtained / s.totalMax) * 100);
                return s;
            });

        // Sort descending
        studentList.sort((a, b) => b.cumulativePercentage - a.cumulativePercentage);

        // Build header rows
        let dateRow = '<th colspan="2" style="border-top-left-radius: 12px; padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"><svg style="width: 14px; height: 14px; display: inline; margin-bottom: -2px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Date</th>';
        let maxMarksRow = '<th colspan="2" style="padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;"><svg style="width: 14px; height: 14px; display: inline; margin-bottom: -2px; margin-right: 4px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg> Max Marks</th>';
        let nameRow = '<th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.1rem; font-weight: 700;">Student Name</th><th style="padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--text-light); text-align: center; font-size: 1rem; font-weight: 700; width: 90px;">Class</th>';

        publishedTests.forEach(test => {
            dateRow += `<th style="text-align: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem; font-weight: 500;">${test.date}</th>`;
            maxMarksRow += `<th style="text-align: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 0.85rem; font-weight: 500;">${test.maxMarks}</th>`;
            nameRow += `<th style="text-align: center; padding: 1rem; border-bottom: 2px solid var(--primary-color); color: #0f172a; font-size: 1.1rem; font-weight: 700; min-width: 120px;">${test.subject}</th>`;
        });
        
        dateRow += '<th style="text-align: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; border-top-right-radius: 12px; background: #fafafa;"></th>'; 
        maxMarksRow += '<th style="text-align: center; padding: 1rem; border-bottom: 1px solid #e2e8f0; background: #fafafa;"></th>'; 
        nameRow += '<th style="text-align: center; padding: 1rem; border-bottom: 2px solid var(--primary-color); color: var(--primary-color); font-size: 1.1rem; font-weight: 700; background: #fafafa; min-width: 140px;">Cumulative %</th>';

        // Build data rows
        let dataRowsHtml = '';
        studentList.forEach((student, index) => {
            const rank = index + 1;
            let rankBadge = '';
            
            if (rank === 1) {
                rankBadge = `<span style="background: linear-gradient(135deg, #ffd700, #daa520); color: white; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 12px; min-width:60px; text-align:center; box-shadow: 0 2px 4px rgba(218,165,32,0.4); display:inline-block;">🥇 1st</span>`;
            } else if (rank === 2) {
                rankBadge = `<span style="background: linear-gradient(135deg, #e0e0e0, #9e9e9e); color: white; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 12px; min-width:60px; text-align:center; box-shadow: 0 2px 4px rgba(158,158,158,0.4); display:inline-block;">🥈 2nd</span>`;
            } else if (rank === 3) {
                rankBadge = `<span style="background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 12px; min-width:60px; text-align:center; box-shadow: 0 2px 4px rgba(139,69,19,0.4); display:inline-block;">🥉 3rd</span>`;
            } else {
                rankBadge = `<span style="background: #f1f5f9; color: #64748b; padding: 0.1rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: bold; margin-right: 12px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); min-width:60px; text-align:center; display:inline-block;">#${rank}</span>`;
            }

            let rowVars = `<td style="padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9;"><div style="display: flex; align-items: center;">${rankBadge}<span style="font-weight: 600; color: #1e293b; font-size: 1.05rem;">${student.name}</span></div></td>`;
            rowVars += `<td style="text-align: center; padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9;"><span style="background: #e2e8f0; color: #475569; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">${student.classStr}</span></td>`;
            
            publishedTests.forEach(test => {
                const mark = student.testMarks[test.id];
                if (mark !== undefined) {
                    rowVars += `<td style="text-align: center; padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 1.05rem;"><span style="background: #f0fdf4; color: #15803d; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 600;">${mark}</span></td>`;
                } else {
                    rowVars += `<td style="text-align: center; padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; color: var(--gray-400); font-weight: 500;">-</td>`;
                }
            });

            // Cumulative cell formatting
            const cumScore = student.cumulativePercentage;
            let cumColor = cumScore >= 80 ? '#15803d' : (cumScore >= 50 ? '#b45309' : '#b91c1c');
            let cumBg = cumScore >= 80 ? '#f0fdf4' : (cumScore >= 50 ? '#fffbeb' : '#fef2f2');
            
            rowVars += `<td style="text-align: center; padding: 1.25rem 1rem; border-bottom: 1px solid #f1f5f9; background: #fafafa;"><span style="font-weight: 800; color: ${cumColor}; background: ${cumBg}; padding: 0.5rem 1rem; border-radius: 8px; font-size: 1.1rem; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);">${cumScore.toFixed(1)}%</span></td>`;
            dataRowsHtml += `<tr style="transition: all 0.2s ease;" onmouseover="this.style.backgroundColor='#f8fafc'" onmouseout="this.style.backgroundColor='transparent'">${rowVars}</tr>`;
        });

        const testCard = document.createElement('div');
        testCard.style.cssText = 'background: white; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); overflow-x: auto; border: 1px solid #e2e8f0; margin-bottom: 3rem;';
        testCard.innerHTML = `
            <table style="width: 100%; min-width: 800px; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="background: linear-gradient(to right, #ffffff, #f8fafc);">${dateRow}</tr>
                    <tr style="background: linear-gradient(to right, #ffffff, #f8fafc);">${maxMarksRow}</tr>
                    <tr style="background: linear-gradient(to right, #ffffff, #f1f5f9);">${nameRow}</tr>
                </thead>
                <tbody>
                    ${dataRowsHtml}
                </tbody>
            </table>
        `;
        resultsContainer.appendChild(testCard);
    }

    await renderPublicResults();
});
