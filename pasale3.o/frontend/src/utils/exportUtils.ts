/**
 * Report Export Utilities
 * Handles Word (.docx), Excel (.xlsx), PDF, and HTML Report exports
 */

interface ExportData {
  title: string;
  dateRange: { startDate: string; endDate: string };
  stats: Array<{ label: string; value: string; change?: string }>;
  charts?: Array<{ title: string; data: any[] }>;
  tables?: Array<{ title: string; headers: string[]; rows: any[][] }>;
  companyName?: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

/**
 * Export to Word Document (.docx)
 * Full report including KPI, charts, tables, and summaries
 */
export const exportToWord = async (data: ExportData) => {
  try {
    // Dynamically import docx library
    const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeightRule, BorderStyle, TextRun } = await import('docx');

    const now = new Date().toLocaleDateString();
    const statsRows = data.stats.map(stat => new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: stat.label, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: stat.value, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: stat.change || '-' })] })] }),
      ],
    }));

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `📊 ${data.title}`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date Range: ${data.dateRange.startDate} to ${data.dateRange.endDate}`,
                italics: true,
              }),
            ],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Summary',
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Metric', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Value', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Change', bold: true })] })] }),
                ],
              }),
              ...statsRows,
            ],
          }),
          new Paragraph({
            children: [new TextRun('')],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated on ${now} by Pasale Business Management`,
                italics: true,
                size: 18,
                color: '999999',
              }),
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    downloadFile(blob, `${data.title.replace(/\s+/g, '_')}_${data.dateRange.startDate}.docx`);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    alert('Error exporting to Word. Please try again.');
  }
};

/**npm 
 * Export to Excel (.xlsx)
 * Tabular data only - excludes graphs and KPI cards
 */
export const exportToExcel = async (data: ExportData) => {
  try {
    // Dynamically import xlsx library
    const XLSX = await import('xlsx');

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Report', data.title],
      ['Date Range', `${data.dateRange.startDate} to ${data.dateRange.endDate}`],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Value', 'Change'],
      ...data.stats.map(s => [s.label, s.value, s.change || '-']),
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Add table sheets if available
    if (data.tables && data.tables.length > 0) {
      data.tables.forEach(table => {
        const tableData = [
          [table.title],
          table.headers,
          ...table.rows,
        ];
        const ws = XLSX.utils.aoa_to_sheet(tableData);
        XLSX.utils.book_append_sheet(wb, ws, table.title.slice(0, 31)); // Sheet name max 31 chars
      });
    }

    XLSX.writeFile(wb, `${data.title.replace(/\s+/g, '_')}_${data.dateRange.startDate}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel. Please try again.');
  }
};

/**
 * Export Full Report as PDF
 * Includes KPI cards, charts, tables, and summaries
 */
export const exportToPDF = (data: ExportData) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const companyName = data.companyName || 'Pasale Business Management';
  const companyAddress = data.companyAddress || '';
  const companyPhone = data.companyPhone || '';
  const companyEmail = data.companyEmail || '';
  
  // Stats cards HTML
  const statsHtml = data.stats
    .map(
      s =>
        `<div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${s.value}</div>
          ${s.change ? `<div class="stat-change ${s.change.startsWith('+') ? 'positive' : s.change.startsWith('-') ? 'negative' : ''}">${s.change}</div>` : ''}
        </div>`
    )
    .join('');

  // Tables HTML
  const tablesHtml = data.tables?.map(table => `
    <div class="table-section">
      <h3 class="table-title">${table.title}</h3>
      <table class="data-table">
        <thead>
          <tr>
            ${table.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') || '';

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.title} - ${companyName}</title>
        <style>
          /* Reset and Base Styles */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          @page {
            size: A4;
            margin: 15mm 20mm 20mm 20mm;
            
            @top-center {
              content: counter(page);
            }
          }
          
          body { 
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; 
            color: #1f2937; 
            line-height: 1.6;
            background: #fff;
            font-size: 12px;
          }
          
          .report-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
          }
          
          /* Header Styles */
          .report-header {
            text-align: center;
            padding-bottom: 20px;
            margin-bottom: 25px;
            border-bottom: 3px solid #6366f1;
            position: relative;
          }
          
          .report-header::after {
            content: '';
            position: absolute;
            bottom: -3px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
          }
          
          .company-name {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 4px;
            letter-spacing: -0.5px;
          }
          
          .company-info {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 15px;
          }
          
          .report-title {
            font-size: 20px;
            font-weight: 600;
            color: #4f46e5;
            margin-bottom: 8px;
          }
          
          .date-range-box {
            display: inline-block;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 12px;
            color: #374151;
          }
          
          .date-range-box strong {
            color: #1f2937;
          }
          
          /* Section Styles */
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            padding-bottom: 8px;
            margin-bottom: 15px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(180deg, #6366f1, #8b5cf6);
            border-radius: 2px;
          }
          
          /* Stats Grid */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
            border: 1px solid #e5e7eb;
            border-left: 4px solid #6366f1;
            padding: 15px;
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          
          .stat-card:nth-child(2) { border-left-color: #10b981; }
          .stat-card:nth-child(3) { border-left-color: #f59e0b; }
          .stat-card:nth-child(4) { border-left-color: #ef4444; }
          
          .stat-label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          
          .stat-value {
            font-size: 22px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 3px;
          }
          
          .stat-change {
            font-size: 11px;
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;
          }
          
          .stat-change.positive {
            color: #059669;
            background: #d1fae5;
          }
          
          .stat-change.negative {
            color: #dc2626;
            background: #fee2e2;
          }
          
          /* Table Styles */
          .table-section {
            margin-top: 20px;
            page-break-inside: avoid;
          }
          
          .table-title {
            font-size: 13px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
          }
          
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          
          .data-table th {
            background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
          }
          
          .data-table th:first-child {
            border-radius: 6px 0 0 0;
          }
          
          .data-table th:last-child {
            border-radius: 0 6px 0 0;
          }
          
          .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
          }
          
          .data-table tbody tr:hover {
            background: #f9fafb;
          }
          
          .data-table tbody tr:last-child td:first-child {
            border-radius: 0 0 0 6px;
          }
          
          .data-table tbody tr:last-child td:last-child {
            border-radius: 0 0 6px 0;
          }
          
          /* Summary Table */
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          .summary-table th,
          .summary-table td {
            padding: 10px 15px;
            text-align: left;
            border: 1px solid #e5e7eb;
          }
          
          .summary-table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 11px;
            text-transform: uppercase;
          }
          
          .summary-table td {
            font-size: 12px;
          }
          
          /* Footer Styles */
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
          }
          
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .footer-left,
          .footer-right {
            flex: 1;
          }
          
          .footer-center {
            flex: 2;
            text-align: center;
          }
          
          .footer-right {
            text-align: right;
          }
          
          .generated-info {
            font-style: italic;
          }
          
          .page-number {
            background: #f3f4f6;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: 500;
          }
          
          /* Signature Section */
          .signature-section {
            margin-top: 50px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            page-break-inside: avoid;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #374151;
            margin-top: 40px;
            padding-top: 8px;
            font-size: 11px;
            color: #6b7280;
          }
          
          /* Print Specific */
          @media print {
            body { 
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .report-container {
              max-width: 100%;
            }
            
            .section { 
              page-break-inside: avoid; 
            }
            
            .no-print {
              display: none !important;
            }
            
            .stat-card,
            .data-table th {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          /* Watermark */
          .watermark {
            position: fixed;
            bottom: 100px;
            right: 50px;
            opacity: 0.03;
            font-size: 80px;
            font-weight: 900;
            transform: rotate(-30deg);
            pointer-events: none;
            z-index: -1;
          }
        </style>
      </head>
      <body>
        <div class="watermark">PASALE</div>
        
        <div class="report-container">
          <!-- Report Header -->
          <div class="report-header">
            <div class="company-name">${companyName}</div>
            ${companyAddress || companyPhone || companyEmail ? `
              <div class="company-info">
                ${[companyAddress, companyPhone, companyEmail].filter(Boolean).join(' | ')}
              </div>
            ` : ''}
            <div class="report-title">📊 ${data.title}</div>
            <div class="date-range-box">
              <strong>Report Period:</strong> ${data.dateRange.startDate} to ${data.dateRange.endDate}
            </div>
          </div>
          
          <!-- Summary Section -->
          <div class="section">
            <h2 class="section-title">Key Performance Indicators</h2>
            <div class="stats-grid">${statsHtml}</div>
          </div>
          
          <!-- Summary Table -->
          <div class="section">
            <h2 class="section-title">Summary Overview</h2>
            <table class="summary-table">
              <thead>
                <tr>
                  <th style="width: 50%">Metric</th>
                  <th style="width: 30%">Value</th>
                  <th style="width: 20%">Change</th>
                </tr>
              </thead>
              <tbody>
                ${data.stats.map(s => `
                  <tr>
                    <td>${s.label}</td>
                    <td style="font-weight: 600;">${s.value}</td>
                    <td>
                      <span class="stat-change ${s.change?.startsWith('+') ? 'positive' : s.change?.startsWith('-') ? 'negative' : ''}" style="display: inline-block;">
                        ${s.change || '-'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Additional Tables -->
          ${tablesHtml}
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">Prepared By</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">Approved By</div>
            </div>
          </div>
          
          <!-- Report Footer -->
          <div class="report-footer">
            <div class="footer-content">
              <div class="footer-left">
                <span class="generated-info">Generated on ${formattedDate} at ${formattedTime}</span>
              </div>
              <div class="footer-center">
                <strong>${companyName}</strong> - Business Report
              </div>
              <div class="footer-right">
                <span class="page-number">Page 1</span>
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};

/**
 * Helper function to download files
 */
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Export report as downloadable HTML file
 * Full structured report that can be opened in browser
 */
export const exportToHTML = (data: ExportData) => {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const companyName = data.companyName || 'Pasale Business Management';
  const companyAddress = data.companyAddress || '';
  const companyPhone = data.companyPhone || '';
  const companyEmail = data.companyEmail || '';
  
  // Stats cards HTML
  const statsHtml = data.stats
    .map(
      s =>
        `<div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${s.value}</div>
          ${s.change ? `<div class="stat-change ${s.change.startsWith('+') ? 'positive' : s.change.startsWith('-') ? 'negative' : ''}">${s.change}</div>` : ''}
        </div>`
    )
    .join('');

  // Tables HTML
  const tablesHtml = data.tables?.map(table => `
    <div class="table-section">
      <h3 class="table-title">${table.title}</h3>
      <table class="data-table">
        <thead>
          <tr>
            ${table.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('') || '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - ${companyName}</title>
  <style>
    /* Reset and Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @page {
      size: A4;
      margin: 15mm 20mm 20mm 20mm;
    }
    
    body { 
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif; 
      color: #1f2937; 
      line-height: 1.6;
      background: #f8fafc;
      font-size: 14px;
      padding: 20px;
    }
    
    .report-container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    
    /* Header Styles */
    .report-header {
      text-align: center;
      padding-bottom: 25px;
      margin-bottom: 30px;
      border-bottom: 3px solid #6366f1;
      position: relative;
    }
    
    .report-header::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 3px;
      background: linear-gradient(90deg, #8b5cf6, #6366f1);
    }
    
    .company-name {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    
    .company-info {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    
    .report-title {
      font-size: 24px;
      font-weight: 600;
      color: #4f46e5;
      margin-bottom: 12px;
    }
    
    .date-range-box {
      display: inline-block;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 14px;
      color: #374151;
    }
    
    .date-range-box strong {
      color: #1f2937;
    }
    
    /* Action Buttons */
    .action-buttons {
      text-align: center;
      margin-bottom: 30px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 10px;
    }
    
    .action-buttons button {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin: 0 8px;
      transition: all 0.2s ease;
    }
    
    .action-buttons button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    
    /* Section Styles */
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      padding-bottom: 10px;
      margin-bottom: 18px;
      border-bottom: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .section-title::before {
      content: '';
      width: 5px;
      height: 20px;
      background: linear-gradient(180deg, #6366f1, #8b5cf6);
      border-radius: 3px;
    }
    
    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 25px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%);
      border: 1px solid #e5e7eb;
      border-left: 5px solid #6366f1;
      padding: 20px;
      border-radius: 12px;
      transition: all 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    }
    
    .stat-card:nth-child(2) { border-left-color: #10b981; }
    .stat-card:nth-child(3) { border-left-color: #f59e0b; }
    .stat-card:nth-child(4) { border-left-color: #ef4444; }
    
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .stat-change {
      font-size: 12px;
      font-weight: 500;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-block;
    }
    
    .stat-change.positive {
      color: #059669;
      background: #d1fae5;
    }
    
    .stat-change.negative {
      color: #dc2626;
      background: #fee2e2;
    }
    
    /* Table Styles */
    .table-section {
      margin-top: 25px;
      page-break-inside: avoid;
    }
    
    .table-title {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    
    .data-table th {
      background: linear-gradient(180deg, #4f46e5 0%, #6366f1 100%);
      color: white;
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 11px;
    }
    
    .data-table th:first-child { border-radius: 8px 0 0 0; }
    .data-table th:last-child { border-radius: 0 8px 0 0; }
    
    .data-table td {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      color: #374151;
    }
    
    .data-table tbody tr:hover { background: #f9fafb; }
    .data-table tbody tr:last-child td:first-child { border-radius: 0 0 0 8px; }
    .data-table tbody tr:last-child td:last-child { border-radius: 0 0 8px 0; }
    
    /* Summary Table */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .summary-table th,
    .summary-table td {
      padding: 12px 18px;
      text-align: left;
      border: 1px solid #e5e7eb;
    }
    
    .summary-table th {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
    }
    
    .summary-table td { font-size: 14px; }
    
    /* Footer Styles */
    .report-footer {
      margin-top: 50px;
      padding-top: 25px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 11px;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .footer-left, .footer-right { flex: 1; }
    .footer-center { flex: 2; text-align: center; }
    .footer-right { text-align: right; }
    .generated-info { font-style: italic; }
    
    .page-number {
      background: #f3f4f6;
      padding: 5px 14px;
      border-radius: 5px;
      font-weight: 500;
    }
    
    /* Signature Section */
    .signature-section {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      page-break-inside: avoid;
    }
    
    .signature-box { text-align: center; }
    
    .signature-line {
      border-top: 1px solid #374151;
      margin-top: 50px;
      padding-top: 10px;
      font-size: 12px;
      color: #6b7280;
    }
    
    /* Print Specific */
    @media print {
      body { 
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .report-container {
        max-width: 100%;
        box-shadow: none;
        padding: 20px;
      }
      
      .action-buttons { display: none !important; }
      .section { page-break-inside: avoid; }
      
      .stat-card, .data-table th {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    /* Watermark */
    .watermark {
      position: fixed;
      bottom: 150px;
      right: 80px;
      opacity: 0.03;
      font-size: 100px;
      font-weight: 900;
      transform: rotate(-30deg);
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">PASALE</div>
  
  <div class="report-container">
    <!-- Action Buttons -->
    <div class="action-buttons">
      <button onclick="window.print()">🖨️ Print Report</button>
      <button onclick="window.close()">✕ Close</button>
    </div>
    
    <!-- Report Header -->
    <div class="report-header">
      <div class="company-name">${companyName}</div>
      ${companyAddress || companyPhone || companyEmail ? `
        <div class="company-info">
          ${[companyAddress, companyPhone, companyEmail].filter(Boolean).join(' | ')}
        </div>
      ` : ''}
      <div class="report-title">📊 ${data.title}</div>
      <div class="date-range-box">
        <strong>Report Period:</strong> ${data.dateRange.startDate} to ${data.dateRange.endDate}
      </div>
    </div>
    
    <!-- Summary Section -->
    <div class="section">
      <h2 class="section-title">Key Performance Indicators</h2>
      <div class="stats-grid">${statsHtml}</div>
    </div>
    
    <!-- Summary Table -->
    <div class="section">
      <h2 class="section-title">Summary Overview</h2>
      <table class="summary-table">
        <thead>
          <tr>
            <th style="width: 50%">Metric</th>
            <th style="width: 30%">Value</th>
            <th style="width: 20%">Change</th>
          </tr>
        </thead>
        <tbody>
          ${data.stats.map(s => `
            <tr>
              <td>${s.label}</td>
              <td style="font-weight: 600;">${s.value}</td>
              <td>
                <span class="stat-change ${s.change?.startsWith('+') ? 'positive' : s.change?.startsWith('-') ? 'negative' : ''}" style="display: inline-block;">
                  ${s.change || '-'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <!-- Additional Tables -->
    ${tablesHtml}
    
    <!-- Signature Section -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line">Prepared By</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Approved By</div>
      </div>
    </div>
    
    <!-- Report Footer -->
    <div class="report-footer">
      <div class="footer-content">
        <div class="footer-left">
          <span class="generated-info">Generated on ${formattedDate} at ${formattedTime}</span>
        </div>
        <div class="footer-center">
          <strong>${companyName}</strong> - Business Report
        </div>
        <div class="footer-right">
          <span class="page-number">Page 1</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadFile(blob, `${data.title.replace(/\s+/g, '_')}_${data.dateRange.startDate}.html`);
};

/**
 * Print full page with enhanced styling
 */
export const printPage = () => {
  window.print();
};

/**
 * Print current report view with custom styling
 */
export const printReport = (elementId?: string) => {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print Report</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  } else {
    window.print();
  }
};
