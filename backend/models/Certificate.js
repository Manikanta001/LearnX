const mongoose = require('mongoose');
const { Schema } = mongoose;

const CertificateSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', default: null, index: true },
  type: { type: String, enum: ['CourseCompletion', 'CodingTrack', 'Contest'], default: 'CourseCompletion' },
  nameOnCertificate: { type: String, required: true },
  courseName: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true, index: true },
  qrCodeData: { type: String, default: '' }, // Text content of QR code, e.g., verification URL
  pdfUrl: { type: String, default: '' }, // URL of generated PDF (if stored)
  dateEarned: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Certificate', CertificateSchema);
