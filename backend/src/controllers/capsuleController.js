const capsuleService = require('../services/capsuleService');
const notificationService = require('../services/notificationService');

class CapsuleController {
  static async createCapsule(req, res) {
    try {
      const { userId, memoryId, unlockDate } = req.body;
      const capsule = await capsuleService.createCapsule(userId, memoryId, unlockDate);
      res.status(201).json({ message: 'Capsule created successfully', capsule });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async inviteCollaborators(req, res) {
    try {
      const { capsuleId, collaboratorIds } = req.body;
      await capsuleService.inviteCollaborators(capsuleId, collaboratorIds);
      res.status(200).json({ message: 'Collaborators invited successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async retrieveContent(req, res) {
    try {
      const { capsuleId } = req.params;
      const content = await capsuleService.retrieveContent(capsuleId);
      res.status(200).json(content);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async notifyUser(req, res) {
    try {
      const { capsuleId } = req.params;
      await notificationService.notifyUser(capsuleId);
      res.status(200).json({ message: 'User notified successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CapsuleController;
