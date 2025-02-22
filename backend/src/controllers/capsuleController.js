const CapsuleService = require('../services/capsuleService');

class CapsuleController {
  // Create capsule with basic info
  static async createCapsule(req, res) {
    try {
      const { userId, title, unlockDate } = req.body;

      if (!userId || !title || !unlockDate) {
        return res.status(400).json({
          error: 'Missing required fields: userId, title, and unlockDate are required'
        });
      }

      const capsule = await CapsuleService.createCapsule(
        userId,
        title,
        unlockDate
      );

      return res.status(201).json({
        message: 'Capsule created successfully',
        capsule
      });
    } catch (error) {
      console.error('Error creating capsule:', error);
      return res.status(500).json({
        error: error.message || 'Failed to create capsule'
      });
    }
  }

  // Upload files to existing capsule
  static async uploadFiles(req, res) {
    try {
      const { capsuleId } = req.params;
      const files = req.files || [];

      if (!capsuleId) {
        return res.status(400).json({
          error: 'capsuleId is required'
        });
      }

      if (!files.length) {
        return res.status(400).json({
          error: 'No files provided'
        });
      }

      const updatedCapsule = await CapsuleService.uploadFilesToCapsule(
        capsuleId,
        files
      );

      return res.status(200).json({
        message: 'Files uploaded successfully',
        capsule: updatedCapsule
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      return res.status(500).json({
        error: error.message || 'Failed to upload files'
      });
    }
  }

  // Invite collaborators
  static async inviteCollaborators(req, res) {
    try {
      const { capsuleId, collaboratorIds } = req.body;

      if (!capsuleId || !collaboratorIds || !Array.isArray(collaboratorIds)) {
        return res.status(400).json({
          error: 'Valid capsuleId and collaboratorIds array are required'
        });
      }

      await CapsuleService.inviteCollaborators(capsuleId, collaboratorIds);
      return res.status(200).json({
        message: 'Collaborators invited successfully'
      });
    } catch (error) {
      console.error('Error inviting collaborators:', error);
      return res.status(500).json({
        error: error.message || 'Failed to invite collaborators'
      });
    }
  }

  // Retrieve capsule content
  static async retrieveContent(req, res) {
    try {
      const { capsuleId } = req.params;

      if (!capsuleId) {
        return res.status(400).json({
          error: 'capsuleId is required'
        });
      }

      const content = await CapsuleService.retrieveContent(capsuleId);
      return res.status(200).json({
        message: 'Content retrieved successfully',
        content
      });
    } catch (error) {
      console.error('Error retrieving content:', error);
      return res.status(500).json({
        error: error.message || 'Failed to retrieve content'
      });
    }
  }

  // Notify user
  static async notifyUser(req, res) {
    try {
      const { capsuleId } = req.params;

      if (!capsuleId) {
        return res.status(400).json({
          error: 'capsuleId is required'
        });
      }

      await CapsuleService.notifyUser(capsuleId);
      return res.status(200).json({
        message: 'User notified successfully'
      });
    } catch (error) {
      console.error('Error notifying user:', error);
      return res.status(500).json({
        error: error.message || 'Failed to notify user'
      });
    }
  }
}

module.exports = CapsuleController;
