const express = require('express');
const router = express.Router();
const multer = require('multer');
const CapsuleController = require('../controllers/capsuleController');
const authMiddleware = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per upload
  }
});

// Create capsule (basic info only)
router.post('/create', authMiddleware, async (req, res) => {
  return await CapsuleController.createCapsule(req, res);
});

// Upload files to existing capsule
router.post('/upload/:capsuleId', authMiddleware, upload.array('files', 10), async (req, res) => {
  return await CapsuleController.uploadFiles(req, res);
});

// Other routes
router.post('/invite', authMiddleware, async (req, res) => {
  return await CapsuleController.inviteCollaborators(req, res);
});

router.get('/retrieve/:capsuleId', authMiddleware, async (req, res) => {
  return await CapsuleController.retrieveContent(req, res);
});

router.post('/notify/:capsuleId', authMiddleware, async (req, res) => {
  return await CapsuleController.notifyUser(req, res);
});

module.exports = router;
