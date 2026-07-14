const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getMyCertificates,
  verifyCertificate,
  downloadCertificatePDF,
} = require('../controllers/certificateController');

// Enrolled / personal certificates list
router.get('/my', authenticate, getMyCertificates);

// Public verification & sharing download endpoints
router.get('/verify/:uniqueId', verifyCertificate);
router.get('/download/:uniqueId', downloadCertificatePDF);

module.exports = router;
