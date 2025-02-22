const AWS = require('aws-sdk');
const env = require('./env');
console.log(process.env.AWS_ACCESS_KEY)
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: env.AWS_REGION,
});

const s3 = new AWS.S3();

module.exports = s3;
