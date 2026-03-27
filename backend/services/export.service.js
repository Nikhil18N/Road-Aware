const { supabase } = require('../config/supabase');
const { parse } = require('json2csv');
const PDFDocument = require('pdfkit');
const { Readable } = require('stream');

/**
 * Export complaints as CSV
 * @param {Object} filters - Query filters (status, severity, department_id, etc.)
 * @returns {Promise<Buffer>} CSV file buffer
 */
async function exportComplaintsAsCSV(filters = {}) {
  try {
    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.department_id) query = query.eq('department_id', filters.department_id);
    if (filters.start_date) query = query.gte('created_at', filters.start_date);
    if (filters.end_date) query = query.lte('created_at', filters.end_date);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No complaints found for export');
    }

    // Transform data for CSV
    const csvData = data.map(complaint => ({
      ID: complaint.id.substring(0, 8),
      'Date Reported': new Date(complaint.created_at).toLocaleDateString(),
      'Location': `${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}`,
      'Description': complaint.description || 'N/A',
      'Severity': complaint.severity || 'Pending',
      'Status': complaint.status,
      'Reporter Name': complaint.reporter_name || 'Anonymous',
      'Reporter Email': complaint.reporter_email || 'N/A',
      'Reporter Phone': complaint.reporter_phone || 'N/A',
      'Potholes Detected': complaint.potholes_detected || 0,
      'Largest Pothole Area (m²)': complaint.largest_pothole_area?.toFixed(2) || 'N/A',
      'Department': complaint.department_id || 'Unassigned',
      'Assigned To': complaint.assigned_to || 'Unassigned',
      'Created At': complaint.created_at,
      'Updated At': complaint.updated_at,
      'Resolved At': complaint.resolved_at || 'Pending'
    }));

    // Create CSV using json2csv
    const csv = parse(csvData);
    return {
      success: true,
      data: Buffer.from(csv, 'utf-8'),
      filename: `complaints-export-${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error) {
    console.error('Error in exportComplaintsAsCSV:', error);
    throw error;
  }
}

/**
 * Export complaints as PDF
 * @param {Object} filters - Query filters
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function exportComplaintsAsPDF(filters = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      let query = supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.department_id) query = query.eq('department_id', filters.department_id);
      if (filters.start_date) query = query.gte('created_at', filters.start_date);
      if (filters.end_date) query = query.lte('created_at', filters.end_date);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch complaints: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No complaints found for export');
      }

      // Create PDF
      const doc = new PDFDocument({
        bufferPages: true,
        margin: 50,
        size: 'A4'
      });

      // Add header
      doc.fontSize(24).font('Helvetica-Bold').text('Road Aware - Complaints Report', 100, 100);
      doc.fontSize(11).font('Helvetica').text(`Generated on: ${new Date().toLocaleDateString()}`, 100, 140);
      doc.moveTo(50, 170).lineTo(550, 170).stroke();

      // Add summary
      const totalComplaints = data.length;
      const resolvedCount = data.filter(c => c.status === 'resolved').length;
      const pendingCount = data.filter(c => c.status !== 'resolved').length;

      doc.fontSize(12).font('Helvetica-Bold').text('Summary', 50, 200);
      doc.fontSize(11).font('Helvetica')
        .text(`Total Complaints: ${totalComplaints}`, 50, 225)
        .text(`Resolved: ${resolvedCount}`, 50, 245)
        .text(`Pending: ${pendingCount}`, 50, 265);

      let yPos = 310;

      // Add complaints table
      doc.fontSize(12).font('Helvetica-Bold').text('Complaints Details', 50, yPos);
      yPos += 30;

      data.forEach((complaint, index) => {
        // Check if we need a new page
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }

        // Complaint box
        doc.fontSize(10).font('Helvetica-Bold')
          .text(`${index + 1}. ID: ${complaint.id.substring(0, 8)}`, 50, yPos);
        yPos += 18;

        doc.fontSize(9).font('Helvetica')
          .text(`Date: ${new Date(complaint.created_at).toLocaleDateString()}`, 60, yPos)
          .text(`Location: ${complaint.latitude.toFixed(6)}, ${complaint.longitude.toFixed(6)}`, 60, yPos + 16)
          .text(`Status: ${complaint.status}`, 60, yPos + 32)
          .text(`Severity: ${complaint.severity || 'Pending'}`, 60, yPos + 48)
          .text(`Reporter: ${complaint.reporter_name || 'Anonymous'}`, 60, yPos + 64);

        if (complaint.description) {
          doc.text(`Description: ${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}`, 60, yPos + 80);
          yPos += 96;
        } else {
          yPos += 80;
        }

        // Add spacing between complaints
        yPos += 10;
      });

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(9).font('Helvetica').text(`Page ${i + 1} of ${pageCount}`, 50, 750);
      }

      // Capture PDF as buffer
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          success: true,
          data: buffer,
          filename: `complaints-export-${new Date().toISOString().split('T')[0]}.pdf`
        });
      });

      doc.end();
    } catch (error) {
      console.error('Error in exportComplaintsAsPDF:', error);
      reject(error);
    }
  });
}

/**
 * Export department analytics as CSV
 * @param {string} department_id - Department ID filter
 * @returns {Promise<Buffer>} CSV file buffer
 */
async function exportDepartmentAnalyticsAsCSV(department_id = null) {
  try {
    let query = supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch complaints: ${error.message}`);
    }

    // Calculate analytics
    const analytics = {
      'Total Complaints': data.length,
      'Resolved': data.filter(c => c.status === 'resolved').length,
      'Pending': data.filter(c => c.status !== 'resolved').length,
      'High Severity': data.filter(c => c.severity === 'High').length,
      'Medium Severity': data.filter(c => c.severity === 'Medium').length,
      'Low Severity': data.filter(c => c.severity === 'Low').length,
      'Avg Resolution Time (hours)': calculateAvgResolutionTime(data)
    };

    // Get severity breakdown
    const severityData = [
      { Severity: 'High', Count: analytics['High Severity'], Percentage: ((analytics['High Severity'] / data.length) * 100).toFixed(1) + '%' },
      { Severity: 'Medium', Count: analytics['Medium Severity'], Percentage: ((analytics['Medium Severity'] / data.length) * 100).toFixed(1) + '%' },
      { Severity: 'Low', Count: analytics['Low Severity'], Percentage: ((analytics['Low Severity'] / data.length) * 100).toFixed(1) + '%' }
    ];

    // Get status breakdown
    const statusData = [
      { Status: 'Resolved', Count: analytics['Resolved'], Percentage: ((analytics['Resolved'] / data.length) * 100).toFixed(1) + '%' },
      { Status: 'Pending', Count: analytics['Pending'], Percentage: ((analytics['Pending'] / data.length) * 100).toFixed(1) + '%' }
    ];

    // Combine all data
    const csvData = [
      { Category: 'Analytics', Value: '', Details: '' },
      ...Object.entries(analytics).map(([key, value]) => ({ Category: key, Value: value, Details: '' })),
      { Category: '', Value: '', Details: '' },
      { Category: 'Severity Breakdown', Value: '', Details: '' },
      ...severityData.map(s => ({ Category: s.Severity, Value: s.Count, Details: s.Percentage })),
      { Category: '', Value: '', Details: '' },
      { Category: 'Status Breakdown', Value: '', Details: '' },
      ...statusData.map(s => ({ Category: s.Status, Value: s.Count, Details: s.Percentage }))
    ];

    const csv = parse(csvData, {
      header: true,
      columns: ['Category', 'Value', 'Details']
    });

    return {
      success: true,
      data: Buffer.from(csv, 'utf-8'),
      filename: `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
    };
  } catch (error) {
    console.error('Error in exportDepartmentAnalyticsAsCSV:', error);
    throw error;
  }
}

/**
 * Helper function to calculate average resolution time
 * @param {Array} complaints - Array of complaint objects
 * @returns {string} Average resolution time in hours
 */
function calculateAvgResolutionTime(complaints) {
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' && c.resolved_at);
  
  if (resolvedComplaints.length === 0) return 'N/A';

  const totalMs = resolvedComplaints.reduce((acc, curr) => {
    const start = new Date(curr.created_at);
    const end = new Date(curr.resolved_at);
    return acc + (end - start);
  }, 0);

  const avgHours = (totalMs / resolvedComplaints.length) / (1000 * 60 * 60);
  return avgHours.toFixed(2);
}

module.exports = {
  exportComplaintsAsCSV,
  exportComplaintsAsPDF,
  exportDepartmentAnalyticsAsCSV
};
