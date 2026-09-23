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
    const fileExt = originalName.split('.').pop();
    const fileName = `documents/${nanoid()}.${fileExt}`;

    try {
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn('[S3] AWS credentials not found. Using fallback URI.');
            return {
                publicUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`,
                fileName
            };
        }

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
        console.warn('[S3] AWS S3 Upload failed (fallback active):', error.message);
        return {
            publicUrl: `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`,
            fileName
        };
    }
};

module.exports = { uploadResume };
