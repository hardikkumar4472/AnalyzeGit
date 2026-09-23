const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { nanoid } = require('nanoid');

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET_NAME || 'analyzegit-resumes';

let s3Client = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
        region,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });
} else {
    // Falls back to IAM Role if running on AWS EC2 or EKS
    s3Client = new S3Client({ region });
}

const uploadResume = async (fileBuffer, originalName, mimeType) => {
    try {
        const fileExt = originalName.split('.').pop();
        const fileName = `documents/${nanoid()}.${fileExt}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        });

        await s3Client.send(command);

        const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;

        return { publicUrl, fileName };
    } catch (error) {
        console.error('AWS S3 Upload Error:', error.message);
        throw error;
    }
};

module.exports = { uploadResume };
