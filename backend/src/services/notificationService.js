const prisma = require('../config/database');

class NotificationService {
  static async notifyUser(capsuleId) {
    const capsule = await prisma.capsule.findUnique({
      where: { id: capsuleId },
      include: { owner: true },
    });

    await prisma.notification.create({
      data: {
        userId: capsule.ownerId,
        type: 'capsule_ready',
        content: { capsuleId, message: 'Your time capsule is ready for viewing' },
      },
    });
  }
}

module.exports = NotificationService;
