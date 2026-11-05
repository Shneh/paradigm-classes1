/**
 * Paradigm Classes ERP - PDF Utilities
 * Direct Vector PDF Generation using jsPDF & AutoTable
 * Guaranteed 100% reliable, crisp, and never blank.
 */

(function (window) {
    'use strict';

    const ParadigmPDF = {};

    // Embedded institute logo (Base64) to ensure zero CORS / network loading issues
    const LOGO_DATA_URI = 'data:image/png;base64,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';

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

    // Helper: Escape HTML for preview
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

    // Helper: Resolve jsPDF constructor
    function getJsPdfConstructor() {
        if (window.jspdf && window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        }
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        return null;
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

    // Helper: Bulletproof PDF file downloader
    function savePdfDoc(doc, filename) {
        try {
            const blob = doc.output('blob');
            const url = (window.URL || window.webkitURL).createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                if (a.parentNode) a.parentNode.removeChild(a);
                (window.URL || window.webkitURL).revokeObjectURL(url);
            }, 1500);
        } catch (e) {
            console.warn('Direct blob download failed, falling back to doc.save:', e);
            doc.save(filename);
        }
    }

    /**
     * =========================================================================
     * 1. FEE RECEIPT HTML (FOR MODAL PREVIEW & PRINT)
     * =========================================================================
     */
    ParadigmPDF.generateReceiptHTML = function (student, payment, cycleStart) {
        if (!student) return '<p>Student details not found.</p>';

        const baseFee = Number(student.fees) || 0;
        const finePaid = payment ? (Number(payment.finePaid) || 0) : 0;
        const totalPaid = (payment && payment.feePaid !== undefined)
            ? Number(payment.feePaid)
            : (baseFee + finePaid);

        const studentIdSafe = String(student.id || '').toUpperCase();
        const cycleSafe = String(cycleStart || '').replace(/-/g, '');
        const receiptNo = 'PC-REC-' + studentIdSafe + '-' + cycleSafe;
        const paidDate = payment && payment.paidOn ? payment.paidOn : new Date().toISOString();
        const collector = (payment && payment.markedBy) ? payment.markedBy : 'Administration';

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
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #b91c1c; padding-bottom: 1rem; margin-bottom: 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <img src="${LOGO_DATA_URI}" alt="Paradigm Classes" style="height: 52px; width: auto; object-fit: contain;">
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
     * =========================================================================
     * 2. DOWNLOAD FEE RECEIPT PDF (DIRECT VECTOR PDF VIA jsPDF)
     * =========================================================================
     */
    ParadigmPDF.downloadReceiptPDF = async function (student, payment, cycleStart) {
        if (!student) {
            alert('Student details not found.');
            return;
        }

        const jsPDFClass = getJsPdfConstructor();
        if (!jsPDFClass) {
            alert('PDF library is loading, please try again in a moment.');
            return;
        }

        const baseFee = Number(student.fees) || 0;
        const finePaid = payment ? (Number(payment.finePaid) || 0) : 0;
        const totalPaid = (payment && payment.feePaid !== undefined)
            ? Number(payment.feePaid)
            : (baseFee + finePaid);

        const studentIdSafe = String(student.id || '').toUpperCase();
        const cycleSafe = String(cycleStart || '').replace(/-/g, '');
        const receiptNo = 'PC-REC-' + studentIdSafe + '-' + cycleSafe;
        const paidDate = payment && payment.paidOn ? payment.paidOn : new Date().toISOString();
        const collector = (payment && payment.markedBy) ? payment.markedBy : 'Administration';

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

        const filename = 'Paradigm_Receipt_' + studentIdSafe + '_' + cycleSafe + '.pdf';

        // Create PDF Document
        const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        // Outer Receipt Card Border
        doc.setDrawColor(30, 58, 138); // #1e3a8a
        doc.setLineWidth(0.8);
        doc.roundedRect(12, 12, 186, 273, 4, 4, 'S');

        // Embedded Logo
        try {
            doc.addImage(LOGO_DATA_URI, 'PNG', 16, 16, 17, 17);
        } catch (e) {
            console.warn('Could not render logo in PDF:', e);
        }

        // Header Titles
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.text('PARADIGM CLASSES', 37, 23);

        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28); // #b91c1c
        doc.text('CENTER FOR ACADEMIC EXCELLENCE', 37, 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Reg. Coaching Institute · CBSE Classes IX–XII & NDA Foundation', 37, 33);

        // Top Right Official Receipt Badge
        doc.setFillColor(220, 252, 231); // #dcfce7
        doc.roundedRect(138, 16, 54, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52); // #166534
        doc.text('OFFICIAL RECEIPT', 147, 21);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(receiptNo, 138, 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Payment Date: ' + formatDate(paidDate), 138, 33);

        // Divider Line
        doc.setDrawColor(185, 28, 28);
        doc.setLineWidth(0.6);
        doc.line(16, 37, 192, 37);

        // Student & Billing Info Box
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(16, 42, 176, 27, 3, 3, 'FD');

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('STUDENT DETAILS', 20, 48);
        doc.text('BILLING CYCLE & RECEIVER', 108, 48);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(student.name || 'N/A', 20, 54);
        doc.text(formatDate(cycleStart) + ' to ' + cycleEndStr, 108, 54);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Student ID: ' + (student.id || 'N/A') + '  |  Class: ' + (student.class || 'N/A'), 20, 61);
        doc.text('Collected by: ' + collector, 108, 61);

        // Table of Particulars
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                startY: 75,
                margin: { left: 16, right: 16 },
                head: [['Particulars / Description', 'Amount (INR)']],
                body: [
                    ['Monthly Tuition Fee', 'Rs ' + baseFee.toLocaleString('en-IN')],
                    ['Late Fine / Miscellaneous Surcharge', 'Rs ' + finePaid.toLocaleString('en-IN')],
                    ['Total Amount Received', 'Rs ' + totalPaid.toLocaleString('en-IN')]
                ],
                theme: 'plain',
                headStyles: {
                    fillColor: [241, 245, 249],
                    textColor: [51, 65, 85],
                    fontStyle: 'bold',
                    fontSize: 8.5
                },
                styles: {
                    fontSize: 8.5,
                    cellPadding: 4,
                    textColor: [30, 41, 59]
                },
                columnStyles: {
                    0: { cellWidth: 120 },
                    1: { cellWidth: 56, halign: 'right' }
                },
                didParseCell: function (data) {
                    if (data.row.index === 2) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [250, 250, 250];
                        if (data.column.index === 1) {
                            data.cell.styles.textColor = [22, 101, 52];
                            data.cell.styles.fontSize = 10;
                        }
                    }
                }
            });
        }

        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 120;

        // Security Notice & Signatory Box
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(100, 116, 139);
        doc.text('Official computer-generated electronic receipt issued by Paradigm Classes ERP.', 16, finalY + 16);
        doc.text('Recorded in central institute ledger. No manual signature required.', 16, finalY + 20);

        // Signatory Box
        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(239, 246, 255);
        doc.roundedRect(144, finalY + 9, 48, 7, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 58, 138);
        doc.text('VERIFIED & PAID', 154, finalY + 14);

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(144, finalY + 23, 192, finalY + 23);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 58, 138);
        doc.text('Authorized Signatory', 150, finalY + 27);

        // Save PDF to Downloads
        savePdfDoc(doc, filename);
    };

    /**
     * =========================================================================
     * 3. ATTENDANCE DATA PROCESSING & SORTING
     * =========================================================================
     */
    ParadigmPDF.processAttendanceData = function (students, attendanceList, options) {
        const opts = options || {};
        const sortBy = opts.sortBy || 'name-asc';
        const classFilter = opts.classFilter || 'all';
        const dateRangeType = opts.dateRangeType || 'all';
        const startDate = opts.startDate || null;
        const endDate = opts.endDate || null;

        let allDates = [...new Set((attendanceList || []).map(a => a.date))].filter(Boolean).sort();

        let filteredDates = allDates;
        if (dateRangeType === 'current-month') {
            const now = new Date();
            const ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            filteredDates = allDates.filter(d => d.startsWith(ym));
        } else if (dateRangeType === 'last-30-days') {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().split('T')[0];
            filteredDates = allDates.filter(d => d >= cutoffStr);
        } else if (dateRangeType === 'custom' && startDate && endDate) {
            filteredDates = allDates.filter(d => d >= startDate && d <= endDate);
        }

        let studentPool = students ? [...students] : [];
        if (classFilter && classFilter !== 'all') {
            studentPool = studentPool.filter(s => {
                if (!s.class) return false;
                return String(s.class).trim().toLowerCase() === String(classFilter).trim().toLowerCase();
            });
        }

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

        // 10-way Custom Sorting
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

        const totalStudents = studentPool.length;
        let sumRates = 0;
        let ratedCount = 0;
        let safeCount = 0;
        let lowCount = 0;

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

    function getSortLabel(sortCode) {
        const labels = {
            'name-asc': 'Student Name (A - Z)',
            'name-desc': 'Student Name (Z - A)',
            'rate-desc': 'Attendance Rate (High to Low)',
            'rate-asc': 'Attendance Rate (Low to High)',
            'id-asc': 'Student ID (Ascending)',
            'id-desc': 'Student ID (Descending)',
            'class-asc': 'Class / Standard (Ascending: IX -> XII)',
            'class-desc': 'Class / Standard (Descending: XII -> IX)',
            'absent-desc': 'Most Absences / Defaulters First',
            'present-desc': 'Highest Presences First'
        };
        return labels[sortCode] || sortCode;
    }

    /**
     * =========================================================================
     * 4. DOWNLOAD ATTENDANCE PDF (DIRECT VECTOR PDF VIA jsPDF & AutoTable)
     * =========================================================================
     */
    ParadigmPDF.downloadAttendancePDF = async function (students, attendanceList, options) {
        const jsPDFClass = getJsPdfConstructor();
        if (!jsPDFClass) {
            alert('PDF library is loading, please try again in a moment.');
            return;
        }

        const opts = options || {};
        const sortBy = opts.sortBy || 'name-asc';
        const reportType = opts.reportType || 'summary';
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = 'Paradigm_Attendance_Report_' + sortBy + '_' + dateStr + '.pdf';

        const data = ParadigmPDF.processAttendanceData(students, attendanceList, opts);
        const sortLabel = getSortLabel(data.sortBy);
        const classLabel = data.classFilter === 'all' ? 'All Classes' : ('Class ' + data.classFilter);
        const generatedOn = new Date().toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        let dateRangeLabel = 'All Recorded Sessions';
        if (data.dates.length > 0) {
            dateRangeLabel = formatDate(data.dates[0]) + ' to ' + formatDate(data.dates[data.dates.length - 1]) + ' (' + data.dates.length + ' sessions)';
        } else {
            dateRangeLabel = 'No sessions recorded';
        }

        // A4 Landscape PDF
        const doc = new jsPDFClass({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        // Logo
        try {
            doc.addImage(LOGO_DATA_URI, 'PNG', 12, 10, 15, 15);
        } catch (e) {
            console.warn('Could not render logo in attendance PDF:', e);
        }

        // Header Text
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 58, 138);
        doc.text('PARADIGM CLASSES', 30, 17);

        doc.setFontSize(8.5);
        doc.setTextColor(185, 28, 28);
        doc.text('CENTER FOR ACADEMIC EXCELLENCE', 30, 22);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('Official Student Attendance Registry  |  Academic Wing', 30, 26);

        // Badge on right
        doc.setFillColor(30, 58, 138);
        doc.roundedRect(210, 10, 75, 7, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('STUDENT ATTENDANCE REPORT', 217, 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(71, 85, 105);
        doc.text('Generated: ' + generatedOn, 210, 22);
        doc.text('Scope: ' + classLabel + '  |  ' + dateRangeLabel, 210, 26);

        // Divider
        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(0.6);
        doc.line(12, 29, 285, 29);

        // 4 KPI Summary boxes
        const kpiWidth = 65;
        const kpis = [
            { title: 'SORTED IN ORDER', val: sortLabel, col: [30, 58, 138] },
            { title: 'STUDENT COUNT', val: data.totalStudents + ' Students (' + data.lowCount + ' Defaulters)', col: [15, 23, 42] },
            { title: 'ATTENDANCE SESSIONS', val: data.totalDates + ' Total Sessions', col: [15, 23, 42] },
            { title: 'INSTITUTE AVG RATE', val: data.avgRate + '%', col: [22, 101, 52] }
        ];

        kpis.forEach((kpi, idx) => {
            const x = 12 + idx * (kpiWidth + 4);
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.3);
            doc.roundedRect(x, 32, kpiWidth, 12, 2, 2, 'FD');

            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text(kpi.title, x + 3, 36.5);

            doc.setFontSize(7.8);
            doc.setTextColor(kpi.col[0], kpi.col[1], kpi.col[2]);
            doc.text(kpi.val, x + 3, 41.5);
        });

        // Format short header date e.g. "02/10"
        const formatShortDate = (dStr) => {
            const parts = dStr.split('-');
            if (parts.length !== 3) return dStr;
            return parts[2] + '/' + parts[1];
        };

        // Table Header & Rows
        const headRow = ['#', 'ID', 'Student Name', 'Class', 'Sessions', 'Present', 'Absent', 'Rate (%)', 'Status'];
        if (reportType === 'detailed') {
            data.dates.forEach(d => {
                headRow.push(formatShortDate(d));
            });
        }

        const bodyRows = [];
        data.students.forEach((s, idx) => {
            const rateVal = s._attendanceRate >= 0 ? s._attendanceRate.toFixed(1) : null;
            const rateText = rateVal !== null ? (rateVal + '%') : 'N/A';

            let statusText = 'NO DATA';
            if (rateVal !== null) {
                const r = parseFloat(rateVal);
                if (r >= 85) statusText = 'REGULAR (>=85%)';
                else if (r >= 75) statusText = 'SATISFACTORY';
                else statusText = 'LOW ATTENDANCE (<75%)';
            }

            const row = [
                idx + 1,
                s.id || '',
                s.name || '',
                s.class || 'N/A',
                s._totalSessions,
                s._presentDays,
                s._absentDays,
                rateText,
                statusText
            ];

            if (reportType === 'detailed') {
                data.dates.forEach(dStr => {
                    const dayRecord = (attendanceList || []).find(a => a.date === dStr);
                    let cellVal = '-';
                    if (dayRecord && dayRecord.records && dayRecord.records[s.id]) {
                        cellVal = dayRecord.records[s.id] === 'present' ? 'P' : 'A';
                    }
                    row.push(cellVal);
                });
            }

            bodyRows.push(row);
        });

        if (typeof doc.autoTable === 'function') {
            const colStyles = {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                2: { cellWidth: reportType === 'detailed' ? 42 : 55, halign: 'left', fontStyle: 'bold' },
                3: { cellWidth: 16, halign: 'center' },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 18, halign: 'center', textColor: [22, 101, 52], fontStyle: 'bold' },
                6: { cellWidth: 18, halign: 'center', textColor: [185, 28, 28], fontStyle: 'bold' },
                7: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
                8: { cellWidth: 38, halign: 'center' }
            };

            doc.autoTable({
                startY: 47,
                margin: { left: 12, right: 12 },
                head: [headRow],
                body: bodyRows,
                theme: 'striped',
                headStyles: {
                    fillColor: [30, 58, 138],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 7.5,
                    halign: 'center'
                },
                styles: {
                    fontSize: 7.5,
                    cellPadding: 2.5,
                    textColor: [15, 23, 42]
                },
                columnStyles: colStyles,
                didParseCell: function (cellData) {
                    if (cellData.section === 'body') {
                        if (cellData.column.index === 7) {
                            const val = parseFloat(cellData.cell.raw);
                            if (val >= 85) cellData.cell.styles.textColor = [22, 101, 52];
                            else if (val >= 75) cellData.cell.styles.textColor = [180, 83, 9];
                            else cellData.cell.styles.textColor = [185, 28, 28];
                        }
                        if (cellData.column.index === 8) {
                            const text = String(cellData.cell.raw);
                            if (text.includes('REGULAR')) cellData.cell.styles.textColor = [22, 101, 52];
                            else if (text.includes('SATISFACTORY')) cellData.cell.styles.textColor = [180, 83, 9];
                            else if (text.includes('LOW')) cellData.cell.styles.textColor = [185, 28, 28];
                        }
                        if (reportType === 'detailed' && cellData.column.index >= 9) {
                            cellData.cell.styles.halign = 'center';
                            cellData.cell.styles.fontStyle = 'bold';
                            if (cellData.cell.raw === 'P') {
                                cellData.cell.styles.textColor = [22, 101, 52];
                                cellData.cell.styles.fillColor = [220, 252, 231];
                            } else if (cellData.cell.raw === 'A') {
                                cellData.cell.styles.textColor = [185, 28, 28];
                                cellData.cell.styles.fillColor = [254, 226, 226];
                            }
                        }
                    }
                },
                didDrawPage: function (pageData) {
                    const pageCount = doc.internal.getNumberOfPages();
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6.8);
                    doc.setTextColor(100, 116, 139);
                    doc.text('Paradigm Classes ERP · Confidential Student Attendance Record · Page ' + pageData.pageNumber + ' of ' + pageCount, 12, 204);
                    doc.text('Authorized Examination & Attendance Wing', 232, 204);
                }
            });
        }

        // Save PDF to Downloads
        savePdfDoc(doc, filename);
    };

    /**
     * Printable Fallback window
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
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Expose globally
    window.ParadigmPDF = ParadigmPDF;

})(window);
