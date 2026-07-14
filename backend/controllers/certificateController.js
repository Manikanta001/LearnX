const Certificate = require('../models/Certificate');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Fetch student's earned certificates
const getMyCertificates = async (req, res) => {
  try {
    const userId = req.user.id;
    const certs = await Certificate.find({ student: userId });
    res.json(certs);
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

// Public certificate verification endpoint
const verifyCertificate = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const certificate = await Certificate.findOne({ uniqueId })
      .populate('student', 'name email');

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate is invalid or could not be found' });
    }

    res.json({
      valid: true,
      uniqueId: certificate.uniqueId,
      studentName: certificate.nameOnCertificate,
      courseName: certificate.courseName,
      dateEarned: certificate.dateEarned,
      type: certificate.type,
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Generate & download PDF certificate dynamically
const downloadCertificatePDF = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const cert = await Certificate.findOne({ uniqueId });

    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Create a new PDF document in Landscape
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    // Pipe PDF directly to response stream
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${uniqueId}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Draw Background border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .strokeColor('#3b82f6') // Indigo/Blue primary
       .stroke();

    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52)
       .lineWidth(1)
       .strokeColor('#a5b4fc')
       .stroke();

    // Title Section
    doc.font('Helvetica-Bold')
       .fontSize(38)
       .fillColor('#1e1b4b') // Dark indigo
       .text('LearnX', 40, 70, { align: 'center' });

    doc.font('Helvetica')
       .fontSize(16)
       .fillColor('#475569')
       .text('INTERNATIONAL ACADEMY FOR CODER EXCELLENCE', 40, 115, { align: 'center', characterSpacing: 1.5 });

    doc.moveDown(2);

    doc.font('Helvetica-Oblique')
       .fontSize(18)
       .fillColor('#64748b')
       .text('This is to certify that', 40, 170, { align: 'center' });

    doc.moveDown(0.5);

    // Student name
    doc.font('Helvetica-Bold')
       .fontSize(32)
       .fillColor('#2563eb') // Blue accent
       .text(cert.nameOnCertificate.toUpperCase(), 40, 205, { align: 'center' });

    doc.moveDown(0.5);

    doc.font('Helvetica')
       .fontSize(16)
       .fillColor('#475569')
       .text('has successfully completed the course track', 40, 255, { align: 'center' });

    doc.moveDown(0.5);

    // Course Name
    doc.font('Helvetica-Bold')
       .fontSize(24)
       .fillColor('#1e1b4b')
       .text(`"${cert.courseName}"`, 40, 290, { align: 'center' });

    doc.moveDown(1.5);

    // Date and Verify ID
    const dateFormatted = new Date(cert.dateEarned).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#64748b')
       .text(`Completion Date: ${dateFormatted}`, 80, 360, { align: 'left' });

    doc.text(`Certificate ID: ${cert.uniqueId}`, 80, 380, { align: 'left' });

    // Generate QR code and embed in PDF
    const verifyUrl = cert.qrCodeData || `http://localhost:3000/verify/${uniqueId}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { margin: 1, width: 90 });
    
    // Draw QR code image bottom right
    doc.image(qrBuffer, doc.page.width - 170, 350, { width: 90 });

    doc.font('Helvetica')
       .fontSize(9)
       .text('Scan to Verify Validity', doc.page.width - 180, 445, { align: 'center', width: 110 });

    // Draw Signatures lines
    doc.moveTo(doc.page.width / 2 - 80, 410)
       .lineTo(doc.page.width / 2 + 80, 410)
       .lineWidth(1)
       .strokeColor('#cbd5e1')
       .stroke();

    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#475569')
       .text('AUTHORIZED ACADEMIC SIGNATURE', 40, 420, { align: 'center' });

    // End stream
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF certificate' });
  }
};

module.exports = {
  getMyCertificates,
  verifyCertificate,
  downloadCertificatePDF,
};
