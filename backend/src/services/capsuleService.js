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
        ACL: 'public-read', // Makes files publicly accessible (optional, adjust based on security needs)
      };

      const result = await s3.upload(uploadParams).promise();
      return result.Location; // Returns the public S3 URL of the uploaded file
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

      // Create the capsule directly
      const capsule = await prisma.capsule.create({
        data: {
          ownerId: userId,
          title,
          unlockDate: new Date(unlockDate),
          isReady: false, // Set to false until media is uploaded (if any)
          description: textContent || undefined, // Store text content directly in Capsule
        },
      });

      // Store text content in S3 (if provided)
      if (textContent) {
        await this.storeCapsuleContent(capsule.id, { text: textContent });
      }

      // Handle file uploads to S3 and store metadata in MediaContent
      if (files && files.length > 0) {
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

        const totalSize = [...imageUploads, ...videoUploads].reduce((sum, file) => sum + file.size, 0);

        await prisma.mediaContent.create({
          data: {
            capsuleId: capsule.id,
            text: textContent || null,
            images: imageUploads,
            videos: videoUploads,
            totalSize: totalSize,
          },
        });

        // Mark capsule as ready if media is uploaded
        await prisma.capsule.update({
          where: { id: capsule.id },
          data: { isReady: true },
        });
      }

      // Optionally create or associate AIOutput (if needed for initial creation)
      const aiOutput = await prisma.aIOutput.create({
        data: {
          capsuleId: capsule.id,
          type: 'initial',
          content: JSON.stringify({}),
          status: 'pending',
        },
      });

      await prisma.capsule.update({
        where: { id: capsule.id },
        data: { aiOutputId: aiOutput.id },
      });

      // Return the capsule with associated media
      return await prisma.capsule.findUnique({
        where: { id: capsule.id },
        include: {
          mediaContent: true, // Include media content directly
          aiOutput: true,     // Include AI output for completeness
        },
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

      // Filter images and videos
      const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
      const videoFiles = files.filter(f => f.mimetype.startsWith('video/'));

      // Upload images to S3
      const imageUploads = await Promise.all(imageFiles.map(async (file) => ({
        name: file.originalname,
        url: await this.uploadFileToS3(file),
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date(),
      })));

      // Upload videos to S3
      const videoUploads = await Promise.all(videoFiles.map(async (file) => ({
        name: file.originalname,
        url: await this.uploadFileToS3(file),
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date(),
      })));

      // Get existing media
      const existingMedia = capsule.mediaContent || { images: [], videos: [], totalSize: 0 };
      const updatedImages = [...(existingMedia.images || []), ...imageUploads];
      const updatedVideos = [...(existingMedia.videos || []), ...videoUploads];

      // Calculate total size
      const totalSize = [...updatedImages, ...updatedVideos].reduce((sum, file) => sum + file.size, 0);

      // Update media content
      const updatedMediaContent = await prisma.mediaContent.upsert({
        where: { capsuleId: capsuleId },
        create: {
          capsuleId: capsuleId,
          images: updatedImages,
          videos: updatedVideos,
          totalSize: totalSize,
          text: existingMedia.text || null,
        },
        update: {
          images: updatedImages,
          videos: updatedVideos,
          totalSize: totalSize,
        },
      });

      // Mark capsule as ready
      await prisma.capsule.update({
        where: { id: capsuleId },
        data: { isReady: true },
      });

      return await prisma.capsule.findUnique({
        where: { id: capsuleId },
        include: {
          mediaText: true, // Include media content directly
          aiOutput: true,  // Include AI output for completeness
        },
      });
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error('Failed to upload files to capsule');
    }
  }

  static async storeCapsuleContent(capsuleId, content) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `capsules/${capsuleId}.json`,
      Body: JSON.stringify(content),
      ContentType: 'application/json',
    };

    await s3.upload(params).promise();
    return { storageKey: params.Key };
  }

  static async retrieveCapsuleContent(capsuleId) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `capsules/${capsuleId}.json`,
    };

    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  }

  static async inviteCollaborators(capsuleId, collaboratorIds) {
    const capsule = await prisma.capsule.findUnique({ where: { id: capsuleId } });
    if (!capsule) {
      throw new Error('Capsule not found');
    }

    for (const collaboratorId of collaboratorIds) {
      await prisma.collaboration.create({
        data: {
          capsuleId: capsule.id,
          userId: collaboratorId,
          role: 'viewer',
        },
      });
    }
  }

  static async checkUnlockDate(capsuleId) {
    const capsule = await prisma.capsule.findUnique({ where: { id: capsuleId } });
    if (new Date() >= new Date(capsule.unlockDate)) {
      return true;
    }
    return false;
  }

  static async retrieveContent(capsuleId) {
    const isUnlocked = await this.checkUnlockDate(capsuleId);
    if (!isUnlocked) {
      throw new Error('Capsule is still locked');
    }

    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { mediaContent: true, aiOutput: true },
    });

    const s3Content = await this.retrieveCapsuleContent(capsule.id);
    const aiAnalysis = await aiService.analyzeContent(s3Content); // Assuming aiService exists
    const storytelling = await aiService.enhanceStorytelling(aiAnalysis);
    const comparison = await aiService.compareThenNow(storytelling);
    const video = await videoService.generateRemotionVideo(comparison); // Assuming videoService exists

    await prisma.capsule.update({
      where: { id: capsuleId },
      data: { isReady: true },
    });

    return {
      content: s3Content,
      media: capsule.mediaContent,
      aiOutput: { analysis: aiAnalysis, storytelling, comparison, video },
    };
  }

  static async notifyUser(capsuleId) {
    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { owner: true },
    });

    await notificationService.notifyUser(capsuleId);
  }
}

module.exports = CapsuleService;
