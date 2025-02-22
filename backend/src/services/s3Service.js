const s3 = require('../config/s3');
const env = require('../config/env');

class S3Service {
  static async storeMemory(memoryId, content) {
    const params = {
      Bucket: env.S3_BUCKET,
      Key: `memories/${memoryId}.json`,
      Body: JSON.stringify(content),
      ContentType: 'application/json',
    };

    await s3.upload(params).promise();
    return { storageKey: params.Key };
  }

  static async retrieveMemory(memoryId) {
    const params = {
      Bucket: env.S3_BUCKET,
      Key: `memories/${memoryId}.json`,
    };

    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  }

  static async uploadFile(file) {
    const params = {
      Bucket: env.S3_BUCKET,
      Key: `media/${Date.now()}_${file.originalname}`,
      Body: file.buffer, // Use file.buffer if using multer.memoryStorage
      ContentType: file.mimetype,
    };

    const data = await s3.upload(params).promise();
    return data.Location; // Returns the S3 URL of the uploaded file
  }
}

module.exports = S3Service;
