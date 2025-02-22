const express = require('express');
const router = express.Router();
const multer = require('multer');
const CaptionController = require('../controllers/captionController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Caption generation endpoint
router.post('/generate', CaptionController.generateCaptions);

module.exports = router;
