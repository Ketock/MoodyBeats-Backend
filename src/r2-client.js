import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 client for storing mixtape archives
 */
export class R2Client {
  constructor(config) {
    this.bucketName = config.bucketName;
    
    // R2 uses S3-compatible API
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to R2
   * @param {string} key - Object key (filename)
   * @param {Buffer} buffer - File buffer
   * @param {string} contentType - MIME type
   */
  async upload(key, buffer, contentType = 'application/zip') {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.client.send(command);
  }

  /**
   * Download a file from R2
   * @param {string} key - Object key (filename)
   * @returns {Promise<Buffer>}
   */
  async download(key) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);
    
    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  }

  /**
   * Check if a file exists in R2
   * @param {string} key - Object key (filename)
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }
}
