import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { R2Client } from './r2-client.js';

// Load environment variables
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME || 'moodybeats-mixtapes',
};

// Validate required environment variables
if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey) {
  console.error('❌ Missing required R2 configuration!');
  console.error('Please set the following environment variables in .env:');
  console.error('  - R2_ACCOUNT_ID');
  console.error('  - R2_ACCESS_KEY_ID');
  console.error('  - R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

// Initialize R2 client
const r2 = new R2Client(R2_CONFIG);

// Initialize Express
const app = express();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept .mixblues files or any archive format
    if (file.originalname.endsWith('.mixblues') || 
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .mixblues archives are allowed.'));
    }
  },
});

// Middleware
app.use(express.json());

// CORS headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

/**
 * POST /upload
 * Upload a mixtape archive
 * 
 * Request: multipart/form-data with 'archive' field
 * Response: { id: string, url: string }
 */
app.post('/upload', upload.single('archive'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique ID
    const id = nanoid(10);
    const key = `${id}.mixblues`;

    // Upload to R2
    await r2.upload(key, req.file.buffer, 'application/zip');

    // Return response matching BackendClient expectations
    const url = `${BASE_URL}/t/${id}`;
    
    res.json({
      id,
      url,
    });

    console.log(`✓ Uploaded mixtape: ${id} (${(req.file.size / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload archive' });
  }
});

/**
 * GET /t/:id
 * Download a mixtape archive
 * 
 * Response: Binary file (application/zip)
 */
app.get('/t/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid mixtape ID' });
    }

    const key = `${id}.mixblues`;

    // Check if file exists
    const exists = await r2.exists(key);
    if (!exists) {
      return res.status(404).json({ error: 'Mixtape not found' });
    }

    // Download from R2
    const buffer = await r2.download(key);

    // Send file
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${id}.mixblues"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);

    console.log(`✓ Downloaded mixtape: ${id} (${(buffer.length / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download archive' });
  }
});

/**
 * GET /
 * Health check endpoint
 */
app.get('/', (_req, res) => {
  res.json({
    service: 'MoodyBeats API',
    status: 'running',
    version: '1.0.0',
    storage: 'cloudflare-r2',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 MoodyBeats backend running on port ${PORT}`);
  console.log(`📦 Using R2 bucket: ${R2_CONFIG.bucketName}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
});
