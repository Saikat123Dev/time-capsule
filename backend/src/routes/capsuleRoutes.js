const express = require('express');
const router = express.Router();
const CapsuleController = require('../controllers/capsuleController');
const authMiddleware = require('../middleware/auth');

router.post('/create', authMiddleware, CapsuleController.createCapsule);
router.post('/invite', authMiddleware, CapsuleController.inviteCollaborators);
router.get('/retrieve/:capsuleId', authMiddleware, CapsuleController.retrieveContent);
router.post('/notify/:capsuleId', authMiddleware, CapsuleController.notifyUser);

module.exports = router;
