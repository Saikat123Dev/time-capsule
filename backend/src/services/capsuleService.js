const prisma = require('../config/database');
const AWS = require('aws-sdk');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

class CapsuleService {
  static async uploadFileToS3(file) {
    try {
      const fileExtension = path.extname(file.originalname);
      const key = `capsules/${uuidv4()}${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  static async createCapsule(userId, title, unlockDate, textContent, files) {
    try {
      // Validate required fields
      if (!userId || !title || !unlockDate) {
        throw new Error('userId, title, and unlockDate are required');
      }

      // First verify the user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Create the capsule with proper relation
      const capsule = await prisma.capsule.create({
        data: {
          title,
          unlockDate: new Date(unlockDate),
          isReady: false,
          description: textContent || undefined,
          owner: {
            connect: { id: userId }
          }
        },
        include: {
          owner: true
        }
      });



    } catch (error) {
      console.error('Capsule creation error:', error);
      throw new Error('Failed to create capsule');
    }
  }

  static async uploadFilesToCapsule(capsuleId, files) {
    try {
      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: { mediaContent: true },
      });

      if (!capsule) {
        throw new Error('Capsule not found');
      }

      const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
      const videoFiles = files.filter(f => f.mimetype.startsWith('video/'));

      const imageUploads = await Promise.all(imageFiles.map(async (file) => ({
        name: file.originalname,
        url: await this.uploadFileToS3(file),
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date(),
      })));

      const videoUploads = await Promise.all(videoFiles.map(async (file) => ({
        name: file.originalname,
        url: await this.uploadFileToS3(file),
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date(),
      })));

      const existingMedia = capsule.mediaContent || { images: [], videos: [], totalSize: 0 };
      const updatedImages = [...(existingMedia.images || []), ...imageUploads];
      const updatedVideos = [...(existingMedia.videos || []), ...videoUploads];
      const totalSize = [...updatedImages, ...updatedVideos].reduce((sum, file) => sum + file.size, 0);

      const updatedMediaContent = await prisma.mediaContent.upsert({
        where: { capsuleId },
        create: {
          capsule: {
            connect: { id: capsuleId }
          },
          images: updatedImages,
          videos: updatedVideos,
          totalSize,
          text: existingMedia.text || null,
        },
        update: {
          images: updatedImages,
          videos: updatedVideos,
          totalSize,
        },
      });

      await prisma.capsule.update({
        where: { id: capsuleId },
        data: { isReady: true },
      });

      return await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: {
          mediaContent: true,
          aiOutput: true,
        },
      });
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload files to capsule');
    }
  }

  static async storeCapsuleContent(capsuleId, content) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `capsules/${capsuleId}.json`,
        Body: JSON.stringify(content),
        ContentType: 'application/json',
      };

      await s3.upload(params).promise();
      return { storageKey: params.Key };
    } catch (error) {
      console.error('S3 content storage error:', error);
      throw new Error('Failed to store capsule content');
    }
  }

  static async retrieveCapsuleContent(capsuleId) {
    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `capsules/${capsuleId}.json`,
      };

      const data = await s3.getObject(params).promise();
      return JSON.parse(data.Body.toString());
    } catch (error) {
      console.error('S3 content retrieval error:', error);
      throw new Error('Failed to retrieve capsule content');
    }
  }

  static async inviteCollaborators(capsuleId, collaboratorIds) {
    try {
      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId }
      });

      if (!capsule) {
        throw new Error('Capsule not found');
      }

      const collaborations = await Promise.all(collaboratorIds.map(async (collaboratorId) => {
        return prisma.collaboration.create({
          data: {
            capsule: {
              connect: { id: capsuleId }
            },
            user: {
              connect: { id: collaboratorId }
            },
            role: 'viewer',
          },
        });
      }));

      return collaborations;
    } catch (error) {
      console.error('Collaboration creation error:', error);
      throw new Error('Failed to invite collaborators');
    }
  }

  static async checkUnlockDate(capsuleId) {
    try {
      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId }
      });

      if (!capsule) {
        throw new Error('Capsule not found');
      }

      return new Date() >= new Date(capsule.unlockDate);
    } catch (error) {
      console.error('Unlock date check error:', error);
      throw new Error('Failed to check unlock date');
    }
  }

  static async retrieveContent(capsuleId) {
    try {
      const isUnlocked = await this.checkUnlockDate(capsuleId);
      if (!isUnlocked) {
        throw new Error('Capsule is still locked');
      }

      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: {
          mediaContent: true,
          aiOutput: true,
        },
      });

      if (!capsule) {
        throw new Error('Capsule not found');
      }

      const s3Content = await this.retrieveCapsuleContent(capsule.id);

      // Note: These services need to be properly imported and implemented
      const aiAnalysis = await aiService.analyzeContent(s3Content);
      const storytelling = await aiService.enhanceStorytelling(aiAnalysis);
      const comparison = await aiService.compareThenNow(storytelling);
      const video = await videoService.generateRemotionVideo(comparison);

      await prisma.capsule.update({
        where: { id: capsuleId },
        data: { isReady: true },
      });

      return {
        content: s3Content,
        media: capsule.mediaContent,
        aiOutput: {
          analysis: aiAnalysis,
          storytelling,
          comparison,
          video,
        },
      };
    } catch (error) {
      console.error('Content retrieval error:', error);
      throw new Error('Failed to retrieve capsule content');
    }
  }

  static async notifyUser(capsuleId) {
    try {
      const capsule = await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: { owner: true },
      });

      if (!capsule) {
        throw new Error('Capsule not found');
      }

      await notificationService.notifyUser(capsuleId);
      return true;
    } catch (error) {
      console.error('Notification error:', error);
      throw new Error('Failed to notify user');
    }
  }
}

module.exports = CapsuleService;
