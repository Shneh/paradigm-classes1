/**
 * Paradigm Classes ERP - PDF Utilities
 * Handles computerized Fee Receipts and Attendance Reports generation, sorting, and PDF downloads.
 */

(function (window) {
    'use strict';

    const ParadigmPDF = {};

    // Helper: Safe date formatter
    function formatDate(dateStr) {
        if (!dateStr) return 'N/A';
        try {
            if (window.DB && typeof window.DB.formatDate === 'function') {
                return window.DB.formatDate(dateStr);
            }
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    // Helper: Escape HTML
    function escapeHTML(str) {
        if (!str && str !== 0) return '';
        if (window.escapeHTML && typeof window.escapeHTML === 'function') {
            return window.escapeHTML(str);
        }
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Class ranking helper for natural ascending/descending class sort
    const CLASS_ORDER = {
        'IX': 9, '9': 9, '9TH': 9,
        'X': 10, '10': 10, '10TH': 10,
        'XI': 11, '11': 11, '11TH': 11,
        'XII': 12, '12': 12, '12TH': 12
    };

    function getClassRank(classStr) {
        if (!classStr) return 999;
        const normalized = String(classStr).toUpperCase().trim();
        for (const key in CLASS_ORDER) {
            if (normalized === key || normalized.includes(key)) {
                return CLASS_ORDER[key];
            }
        }
        return 999;
    }

    /**
     * =========================================================================
     * 1. FEE RECEIPT GENERATOR & DOWNLOAD
     * =========================================================================
     */

    /**
     * Generates HTML markup for official student fee receipt card
     */
    ParadigmPDF.generateReceiptHTML = function (student, payment, cycleStart) {
        if (!student) return '<p>Student not found.</p>';

        const baseFee = Number(student.fees) || 0;
        const finePaid = payment ? (Number(payment.finePaid) || 0) : 0;
        const totalPaid = (payment && payment.feePaid !== undefined)
            ? Number(payment.feePaid)
            : (baseFee + finePaid);

        const studentIdSafe = String(student.id || '').toUpperCase();
        const cycleSafe = String(cycleStart || '').replace(/-/g, '');
        const receiptNo = `PC-REC-${studentIdSafe}-${cycleSafe}`;
        const paidDate = payment && payment.paidOn ? payment.paidOn : new Date().toISOString();
        const collector = (payment && payment.markedBy) ? payment.markedBy : 'Administration';

        // Compute cycle end date (30 days from cycle start)
        let cycleEndStr = 'Cycle End';
        try {
            if (cycleStart) {
                const sDate = new Date(cycleStart);
                sDate.setDate(sDate.getDate() + 30);
                cycleEndStr = formatDate(sDate.toISOString().split('T')[0]);
            }
        } catch (e) {
            cycleEndStr = 'Cycle End';
        }

        return `
            <div class="receipt-print-wrapper" id="receiptPrintWrapper" style="border: 2px solid #1e3a8a; border-radius: 12px; padding: 2rem; background: #ffffff; color: #0f172a; font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; max-width: 650px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
                <!-- Header Banner -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b91c1c; padding-bottom: 1rem; margin-bottom: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <img src="images/logo.png" alt="Paradigm Classes" style="height: 52px; width: auto; object-fit: contain;" onerror="this.style.display='none'">
                        <div>
                            <h2 style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #1e3a8a; letter-spacing: 0.04em; text-transform: uppercase;">PARADIGM CLASSES</h2>
                            <div style="font-size: 0.78rem; color: #b91c1c; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">CENTER FOR ACADEMIC EXCELLENCE</div>
                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.2rem;">Reg. Coaching Institute · CBSE Curriculum &amp; Competitive Foundation</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; background: #dcfce7; color: #166534; font-size: 0.75rem; font-weight: 800; padding: 0.35rem 0.75rem; border-radius: 9999px; letter-spacing: 0.05em; border: 1px solid #86efac;">OFFICIAL RECEIPT</span>
                        <div style="font-size: 0.85rem; font-weight: 800; color: #0f172a; margin-top: 0.4rem; font-family: monospace;">${escapeHTML(receiptNo)}</div>
                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.15rem;">Payment Date: <strong>${formatDate(paidDate)}</strong></div>
                    </div>
                </div>

                <!-- Student & Billing Info Box -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.85rem; margin-bottom: 1.25rem; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <div>
                        <div style="color: #64748b; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Student Details</div>
                        <div style="font-weight: 800; color: #0f172a; font-size: 0.95rem; margin-top: 0.2rem;">${escapeHTML(student.name)}</div>
                        <div style="color: #475569; font-size: 0.8rem; margin-top: 0.2rem;">ID: <strong style="color: #1e3a8a;">${escapeHTML(student.id)}</strong> &bull; Class: <strong>${escapeHTML(student.class || 'N/A')}</strong></div>
                    </div>
                    <div>
                        <div style="color: #64748b; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Billing Cycle &amp; Receiver</div>
                        <div style="font-weight: 700; color: #0f172a; margin-top: 0.2rem;">${formatDate(cycleStart)} to ${cycleEndStr}</div>
                        <div style="color: #475569; font-size: 0.8rem; margin-top: 0.2rem;">Collected by: <strong>${escapeHTML(collector)}</strong></div>
                    </div>
                </div>

                <!-- Particulars Breakdown Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; font-size: 0.88rem;">
                    <thead>
                        <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; background: #f1f5f9;">
                            <th style="padding: 0.6rem 0.75rem; color: #334155; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">Particulars / Description</th>
                            <th style="padding: 0.6rem 0.75rem; text-align: right; color: #334155; font-weight: 700; font-size: 0.8rem; text-transform: uppercase;">Amount (INR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 0.65rem 0.75rem; color: #1e293b;">Monthly Tuition Fee</td>
                            <td style="padding: 0.65rem 0.75rem; text-align: right; font-weight: 600; color: #1e293b;">₹${baseFee.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 0.65rem 0.75rem; color: #1e293b;">Late Fine / Miscellaneous Surcharge</td>
                            <td style="padding: 0.65rem 0.75rem; text-align: right; font-weight: 600; color: ${finePaid > 0 ? '#b91c1c' : '#1e293b'};">₹${finePaid.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr style="border-top: 2px solid #0f172a; background: #fafafa;">
                            <td style="padding: 0.85rem 0.75rem; font-weight: 800; font-size: 1rem; color: #0f172a;">Total Amount Received</td>
                            <td style="padding: 0.85rem 0.75rem; text-align: right; font-weight: 800; font-size: 1.15rem; color: #166534;">₹${totalPaid.toLocaleString('en-IN')}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Verification Stamp & Signatory Strip -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed #cbd5e1;">
                    <div style="font-size: 0.72rem; color: #64748b; max-width: 320px; line-height: 1.4;">
                        🔒 Official computer-generated electronic receipt issued by <strong>Paradigm Classes ERP</strong>.<br>
                        Recorded in central institute ledger. No manual signature required.
                    </div>
                    <div style="text-align: center; min-width: 160px;">
                        <div style="display: inline-block; border: 1.5px solid #1e3a8a; border-radius: 6px; padding: 0.25rem 0.6rem; margin-bottom: 0.35rem; background: #eff6ff;">
                            <span style="font-size: 0.72rem; font-weight: 800; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.05em;">VERIFIED &amp; PAID</span>
                        </div>
                        <div style="border-top: 1px solid #94a3b8; padding-top: 0.25rem; font-size: 0.75rem; font-weight: 700; color: #1e3a8a;">
                            Authorized Signatory
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Downloads student fee receipt as PDF directly
     */
    ParadigmPDF.downloadReceiptPDF = async function (student, payment, cycleStart) {
        if (!student) {
            alert('Student details not found.');
            return;
        }

        const studentIdSafe = String(student.id || '').toUpperCase();
        const cycleSafe = String(cycleStart || '').replace(/-/g, '');
        const filename = `Paradigm_Receipt_${studentIdSafe}_${cycleSafe}.pdf`;

        const receiptHTML = ParadigmPDF.generateReceiptHTML(student, payment, cycleStart);

        // Check if html2pdf is loaded
        if (typeof window.html2pdf !== 'undefined') {
            // Create an offscreen wrapper to ensure clean rendering without page clipping
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '680px';
            container.style.padding = '10px';
            container.style.background = '#ffffff';
            container.style.zIndex = '-9999';
            container.innerHTML = receiptHTML;
            document.body.appendChild(container);

            const opt = {
                margin: [10, 10, 10, 10],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            try {
                await window.html2pdf().set(opt).from(container).save();
            } catch (err) {
                console.error('Error generating receipt PDF with html2pdf:', err);
                ParadigmPDF.printReceiptFallback(receiptHTML, filename);
            } finally {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        } else {
            // Graceful Fallback: Native print/save as PDF window
            ParadigmPDF.printReceiptFallback(receiptHTML, filename);
        }
    };

    /**
     * Printable Fallback window if html2pdf is unavailable
     */
    ParadigmPDF.printReceiptFallback = function (receiptHTML, title) {
        const printWindow = window.open('', '_blank', 'width=800,height=800');
        if (!printWindow) {
            alert('Popup blocked. Please allow popups or use the Print button to save as PDF.');
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${escapeHTML(title || 'Paradigm Classes Fee Receipt')}</title>
                <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800&display=swap" rel="stylesheet" />
                <style>
                    body {
                        font-family: 'Satoshi', sans-serif;
                        background: #f8fafc;
                        padding: 2rem;
                        display: flex;
                        justify-content: center;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        @page { margin: 12mm; }
                    }
                </style>
            </head>
            <body>
                ${receiptHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    /**
     * =========================================================================
     * 2. ATTENDANCE REPORT GENERATOR & DOWNLOAD (SORTED AS ADMIN WANTS)
     * =========================================================================
     */

    /**
     * Computes attendance stats for all students and applies admin's selected sorting & filters
     */
    ParadigmPDF.processAttendanceData = function (students, attendanceList, options) {
        const opts = options || {};
        const sortBy = opts.sortBy || 'name-asc';
        const classFilter = opts.classFilter || 'all';
        const dateRangeType = opts.dateRangeType || 'all';
        const startDate = opts.startDate || null;
        const endDate = opts.endDate || null;

        // 1. Filter dates based on scope
        let allDates = [...new Set((attendanceList || []).map(a => a.date))].filter(Boolean).sort();

        let filteredDates = allDates;
        if (dateRangeType === 'current-month') {
            const now = new Date();
            const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            filteredDates = allDates.filter(d => d.startsWith(ym));
        } else if (dateRangeType === 'last-30-days') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().split('T')[0];
            filteredDates = allDates.filter(d => d >= cutoffStr);
        } else if (dateRangeType === 'custom' && startDate && endDate) {
            filteredDates = allDates.filter(d => d >= startDate && d <= endDate);
        }

        // 2. Filter students by class if specified
        let studentPool = students ? [...students] : [];
        if (classFilter && classFilter !== 'all') {
            studentPool = studentPool.filter(s => {
                if (!s.class) return false;
                return String(s.class).trim().toLowerCase() === String(classFilter).trim().toLowerCase();
            });
        }

        // 3. Compute stats for each student over filteredDates
        studentPool.forEach(student => {
            let totalSessions = 0;
            let presentCount = 0;
            let absentCount = 0;

            filteredDates.forEach(dStr => {
                const dayRec = attendanceList.find(a => a.date === dStr);
                if (dayRec && dayRec.records && dayRec.records[student.id]) {
                    totalSessions++;
                    if (dayRec.records[student.id] === 'present') {
                        presentCount++;
                    } else {
                        absentCount++;
                    }
                }
            });

            student._totalSessions = totalSessions;
            student._presentDays = presentCount;
            student._absentDays = absentCount;
            student._attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : -1;
        });

        // 4. Sort students according to Admin's exact preference
        studentPool.sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                case 'rate-desc':
                    if (b._attendanceRate !== a._attendanceRate) {
                        return b._attendanceRate - a._attendanceRate;
                    }
                    return (a.name || '').localeCompare(b.name || '');
                case 'rate-asc':
                    if (a._attendanceRate !== b._attendanceRate) {
                        return a._attendanceRate - b._attendanceRate;
                    }
                    return (a.name || '').localeCompare(b.name || '');
                case 'id-asc':
                    return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
                case 'id-desc':
                    return (b.id || '').localeCompare(a.id || '', undefined, { numeric: true });
                case 'class-asc': {
                    const diff = getClassRank(a.class) - getClassRank(b.class);
                    return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
                }
                case 'class-desc': {
                    const diff = getClassRank(b.class) - getClassRank(a.class);
                    return diff !== 0 ? diff : (a.name || '').localeCompare(b.name || '');
                }
                case 'absent-desc': {
                    const diff = (b._absentDays || 0) - (a._absentDays || 0);
                    return diff !== 0 ? diff : (a._attendanceRate - b._attendanceRate);
                }
                case 'present-desc': {
                    const diff = (b._presentDays || 0) - (a._presentDays || 0);
                    return diff !== 0 ? diff : (b._attendanceRate - a._attendanceRate);
                }
                default:
                    return (a.name || '').localeCompare(b.name || '');
            }
        });

        // 5. Aggregate overall metrics
        const totalStudents = studentPool.length;
        let sumRates = 0;
        let ratedCount = 0;
        let safeCount = 0; // >= 75%
        let lowCount = 0;  // < 75%

        studentPool.forEach(s => {
            if (s._attendanceRate >= 0) {
                sumRates += s._attendanceRate;
                ratedCount++;
                if (s._attendanceRate >= 75) safeCount++;
                else lowCount++;
            }
        });

        const avgRate = ratedCount > 0 ? (sumRates / ratedCount).toFixed(1) : '0.0';

        return {
            students: studentPool,
            dates: filteredDates,
            totalStudents,
            totalDates: filteredDates.length,
            avgRate,
            safeCount,
            lowCount,
            sortBy,
            classFilter,
            dateRangeType
        };
    };

    /**
     * Formats sort label for report header
     */
    function getSortLabel(sortCode) {
        const labels = {
            'name-asc': 'Student Name (A - Z)',
            'name-desc': 'Student Name (Z - A)',
            'rate-desc': 'Attendance Rate (High to Low)',
            'rate-asc': 'Attendance Rate (Low to High)',
            'id-asc': 'Student ID (Ascending)',
            'id-desc': 'Student ID (Descending)',
            'class-asc': 'Class / Standard (Ascending: IX → XII)',
            'class-desc': 'Class / Standard (Descending: XII → IX)',
            'absent-desc': 'Most Absences / Defaulters First',
            'present-desc': 'Highest Presences First'
        };
        return labels[sortCode] || sortCode;
    }

    /**
     * Generates HTML markup for Attendance PDF Report
     */
    ParadigmPDF.generateAttendanceReportHTML = function (students, attendanceList, options) {
        const data = ParadigmPDF.processAttendanceData(students, attendanceList, options);
        const reportType = (options && options.reportType) || 'summary'; // 'summary' or 'detailed'
        const generatedOn = new Date().toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const sortLabel = getSortLabel(data.sortBy);
        const classLabel = data.classFilter === 'all' ? 'All Classes' : `Class ${data.classFilter}`;
        
        let dateRangeLabel = 'All Recorded Sessions';
        if (data.dates.length > 0) {
            dateRangeLabel = `${formatDate(data.dates[0])} to ${formatDate(data.dates[data.dates.length - 1])} (${data.dates.length} sessions)`;
        } else {
            dateRangeLabel = 'No sessions recorded';
        }

        // Format short header date e.g. "02 Jul"
        const formatShortDate = (dStr) => {
            const parts = dStr.split('-');
            if (parts.length !== 3) return dStr;
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const d = parts[2];
            const m = months[parseInt(parts[1], 10) - 1] || parts[1];
            return `${d} ${m}`;
        };

        // Table Rows HTML
        let tableRowsHTML = '';
        if (data.students.length === 0) {
            const colSpan = reportType === 'detailed' ? (9 + data.dates.length) : 9;
            tableRowsHTML = `<tr><td colspan="${colSpan}" style="text-align: center; padding: 2rem; color: #64748b;">No students found matching the selected filter.</td></tr>`;
        } else {
            data.students.forEach((s, idx) => {
                const rateVal = s._attendanceRate >= 0 ? s._attendanceRate.toFixed(1) : null;
                const rateText = rateVal !== null ? `${rateVal}%` : 'N/A';
                
                let rateColor = '#64748b';
                let statusBadge = '<span style="background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:99px; font-size:10px; font-weight:700;">NO DATA</span>';
                
                if (rateVal !== null) {
                    const r = parseFloat(rateVal);
                    if (r >= 85) {
                        rateColor = '#166534';
                        statusBadge = '<span style="background:#dcfce7; color:#166534; padding:3px 8px; border-radius:99px; font-size:10px; font-weight:700;">REGULAR (≥85%)</span>';
                    } else if (r >= 75) {
                        rateColor = '#b45309';
                        statusBadge = '<span style="background:#fef3c7; color:#b45309; padding:3px 8px; border-radius:99px; font-size:10px; font-weight:700;">SATISFACTORY</span>';
                    } else {
                        rateColor = '#b91c1c';
                        statusBadge = '<span style="background:#fee2e2; color:#b91c1c; padding:3px 8px; border-radius:99px; font-size:10px; font-weight:700;">LOW ATTENDANCE (&lt;75%)</span>';
                    }
                }

                let extraCols = '';
                if (reportType === 'detailed') {
                    data.dates.forEach(date => {
                        const dayRecord = (attendanceList || []).find(a => a.date === date);
                        let cellContent = '-';
                        let cellBg = '';
                        let cellColor = '#94a3b8';

                        if (dayRecord && dayRecord.records && dayRecord.records[s.id]) {
                            const status = dayRecord.records[s.id];
                            if (status === 'present') {
                                cellContent = 'P';
                                cellBg = '#dcfce7';
                                cellColor = '#166534';
                            } else {
                                cellContent = 'A';
                                cellBg = '#fee2e2';
                                cellColor = '#991b1b';
                            }
                        }

                        extraCols += `
                            <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-weight: 700; font-size: 10px; background-color: ${cellBg}; color: ${cellColor};">
                                ${cellContent}
                            </td>
                        `;
                    });
                }

                tableRowsHTML += `
                    <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${idx + 1}</td>
                        <td style="padding: 6px 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 700; font-size: 11px; color: #1e3a8a; font-family: monospace;">${escapeHTML(s.id)}</td>
                        <td style="padding: 6px 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 700; font-size: 12px; color: #0f172a;">${escapeHTML(s.name)}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #475569;">${escapeHTML(s.class || 'N/A')}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">${s._totalSessions}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #166534;">${s._presentDays}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #b91c1c;">${s._absentDays}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0; font-weight: 800; font-size: 12px; color: ${rateColor};">${rateText}</td>
                        <td style="padding: 6px 8px; text-align: center; border: 1px solid #e2e8f0;">${statusBadge}</td>
                        ${extraCols}
                    </tr>
                `;
            });
        }

        // Detailed Date Headers
        let dateHeadersHTML = '';
        if (reportType === 'detailed') {
            data.dates.forEach(dStr => {
                dateHeadersHTML += `
                    <th style="padding: 6px 3px; border: 1px solid #cbd5e1; text-align: center; font-size: 9px; font-weight: 700; color: #0f172a; min-width: 28px; white-space: nowrap; background: #f1f5f9;">
                        ${formatShortDate(dStr)}
                    </th>
                `;
            });
        }

        return `
            <div id="printableAttendanceReport" style="background: #ffffff; padding: 24px; color: #0f172a; font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; width: 1000px; margin: 0 auto;">
                <!-- Official Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 16px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="images/logo.png" alt="Logo" style="height: 48px; width: auto; object-fit: contain;" onerror="this.style.display='none'">
                        <div>
                            <h1 style="margin: 0; font-size: 1.55rem; font-weight: 900; color: #1e3a8a; letter-spacing: 0.03em;">PARADIGM CLASSES</h1>
                            <div style="font-size: 0.8rem; color: #b91c1c; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">CENTER FOR ACADEMIC EXCELLENCE</div>
                            <div style="font-size: 0.72rem; color: #64748b; margin-top: 2px;">Comprehensive Student Attendance Ledger &bull; Official Institute Record</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: inline-block; background: #1e3a8a; color: #ffffff; font-size: 0.75rem; font-weight: 800; padding: 4px 12px; border-radius: 6px; letter-spacing: 0.06em;">STUDENT ATTENDANCE REPORT</span>
                        <div style="font-size: 0.75rem; color: #475569; margin-top: 6px;">Generated: <strong>${generatedOn}</strong></div>
                        <div style="font-size: 0.75rem; color: #475569;">Scope: <strong>${classLabel}</strong></div>
                    </div>
                </div>

                <!-- Parameters & Metadata Strip -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; font-size: 0.82rem;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                        <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Sorted By (Admin Preference)</div>
                        <div style="font-weight: 800; color: #1e3a8a; margin-top: 3px; font-size: 0.88rem;">${sortLabel}</div>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                        <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Date Period &amp; Sessions</div>
                        <div style="font-weight: 800; color: #0f172a; margin-top: 3px; font-size: 0.88rem;">${dateRangeLabel}</div>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                        <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Class Average Attendance</div>
                        <div style="font-weight: 800; color: #166534; margin-top: 3px; font-size: 0.95rem;">${data.avgRate}%</div>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                        <div style="font-size: 0.68rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Student Count / Alerts</div>
                        <div style="font-weight: 800; color: #0f172a; margin-top: 3px; font-size: 0.88rem;">
                            ${data.totalStudents} Students &bull; <span style="color:#b91c1c;">${data.lowCount} Low (&lt;75%)</span>
                        </div>
                    </div>
                </div>

                <!-- Tabular Report -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; border: 1px solid #cbd5e1;">
                    <thead>
                        <tr style="background: #1e3a8a; color: #ffffff;">
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 35px;">#</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: left; font-size: 11px; font-weight: 700; width: 65px;">Student ID</th>
                            <th style="padding: 8px 8px; border: 1px solid #1e3a8a; text-align: left; font-size: 11px; font-weight: 700; min-width: 140px;">Student Name</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 55px;">Class</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 60px;">Sessions</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 55px; background: #166534;">Present</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 55px; background: #991b1b;">Absent</th>
                            <th style="padding: 8px 6px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 75px;">Rate (%)</th>
                            <th style="padding: 8px 8px; border: 1px solid #1e3a8a; text-align: center; font-size: 11px; font-weight: 700; width: 130px;">Attendance Status</th>
                            ${dateHeadersHTML}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRowsHTML}
                    </tbody>
                </table>

                <!-- Official Footer -->
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 24px; padding-top: 12px; border-top: 1px solid #cbd5e1; font-size: 0.72rem; color: #64748b;">
                    <div>
                        <strong>Paradigm Classes ERP &bull; Official Attendance Registry</strong><br>
                        Confidential Academic Document &bull; Verified by Administrative Examination &amp; Attendance Wing.
                    </div>
                    <div style="text-align: center; min-width: 170px;">
                        <div style="border-top: 1px solid #64748b; padding-top: 4px; font-weight: 700; color: #1e3a8a; font-size: 0.78rem;">
                            Administrative In-Charge / Principal
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    /**
     * Downloads attendance report as PDF using html2pdf with landscape orientation
     */
    ParadigmPDF.downloadAttendancePDF = async function (students, attendanceList, options) {
        const opts = options || {};
        const sortBy = opts.sortBy || 'name-asc';
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Paradigm_Attendance_Report_${sortBy}_${dateStr}.pdf`;

        const reportHTML = ParadigmPDF.generateAttendanceReportHTML(students, attendanceList, opts);

        if (typeof window.html2pdf !== 'undefined') {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '1050px';
            container.style.padding = '12px';
            container.style.background = '#ffffff';
            container.style.zIndex = '-9999';
            container.innerHTML = reportHTML;
            document.body.appendChild(container);

            const opt = {
                margin: [8, 8, 8, 8],
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 1100 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            try {
                await window.html2pdf().set(opt).from(container).save();
            } catch (err) {
                console.error('Error generating attendance PDF with html2pdf:', err);
                ParadigmPDF.printAttendanceFallback(reportHTML, filename);
            } finally {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                }
            }
        } else {
            ParadigmPDF.printAttendanceFallback(reportHTML, filename);
        }
    };

    /**
     * Print fallback for attendance report
     */
    ParadigmPDF.printAttendanceFallback = function (reportHTML, title) {
        const printWindow = window.open('', '_blank', 'width=1100,height=800');
        if (!printWindow) {
            alert('Popup blocked. Please allow popups to print/save Attendance Report as PDF.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${escapeHTML(title || 'Paradigm Classes Attendance Report')}</title>
                <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800&display=swap" rel="stylesheet" />
                <style>
                    body {
                        font-family: 'Satoshi', sans-serif;
                        background: #f8fafc;
                        margin: 0;
                        padding: 15px;
                        display: flex;
                        justify-content: center;
                    }
                    @media print {
                        body { background: white; padding: 0; }
                        @page { size: landscape; margin: 8mm; }
                    }
                </style>
            </head>
            <body>
                ${reportHTML}
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 250);
                    };
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Expose globally
    window.ParadigmPDF = ParadigmPDF;

})(window);

