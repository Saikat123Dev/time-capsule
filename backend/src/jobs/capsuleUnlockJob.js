const cron = require('node-cron');
const capsuleService = require('../services/capsuleService');
const prisma = require('../config/database');

class CapsuleUnlockJob {
  static start() {
    cron.schedule('*/5 * * * *', async () => {
      const now = new Date();
      const capsules = await prisma.capsule.findMany({
        where: {
          memory: {
            unlockDate: { lte: now },
            status: 'locked',
          },
        },
      });

      for (const capsule of capsules) {
        try {
          await capsuleService.retrieveContent(capsule.id);
          await prisma.memory.update({
            where: { id: capsule.memoryId },
            data: { status: 'unlocked' },
          });
        } catch (error) {
          console.error(`Failed to unlock capsule ${capsule.id}: ${error.message}`);
        }
      }
    });
  }
}

module.exports = CapsuleUnlockJob;
