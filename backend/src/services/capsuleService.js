const prisma = require('../config/database');
const s3Service = require('./s3Service');
const aiService = require('./aiService');
const videoService = require('./videoService');
const notificationService = require('./notificationService');

class CapsuleService {
  static async createCapsule(userId, memoryId, unlockDate) {
    const memory = await prisma.memory.create({
      data: {
        userId,
        title: `Memory_${Date.now()}`,
        unlockDate: new Date(unlockDate),
        status: 'locked',
      },
    });

    const capsule = await prisma.capsule.create({
      data: {
        memoryId: memory.id,
        ownerId: userId,
        title: `Capsule_${Date.now()}`,
      },
    });

    await s3Service.storeMemory(memory.id, { content: 'Initial content' });
    return capsule;
  }

  static async inviteCollaborators(capsuleId, collaboratorIds) {
    const capsule = await prisma.capsule.findUnique({ where: { id: capsuleId } });
    for (const collaboratorId of collaboratorIds) {
      await prisma.collaboration.create({
        data: {
          memoryId: capsule.memoryId,
          userId: collaboratorId,
          role: 'viewer',
        },
      });
    }
  }

  static async checkUnlockDate(capsuleId) {
    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { memory: true },
    });

    if (new Date() >= new Date(capsule.memory.unlockDate)) {
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
      include: { memory: { include: { mediaContent: true, secureStorage: true } } },
    });

    const s3Content = await s3Service.retrieveMemory(capsule.memory.id);
    const aiAnalysis = await aiService.analyzeContent(s3Content);
    const storytelling = await aiService.enhanceStorytelling(aiAnalysis);
    const comparison = await aiService.compareThenNow(storytelling);
    const video = await videoService.generateRemotionVideo(comparison);

    await prisma.capsule.update({
      where: { id: capsuleId },
      data: { isReady: true },
    });

    return { content: s3Content, aiOutput: { analysis: aiAnalysis, storytelling, comparison, video } };
  }
}

module.exports = CapsuleService;
