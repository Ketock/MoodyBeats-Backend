# MoodyBeats Backend - Quick Deployment

Minimal backend API for MoodyBeats mixtape sharing with Cloudflare R2.

## What This Backend Does

- **POST /upload** - Accepts .mixblues files, stores in R2, returns unique URL
- **GET /t/:id** - Downloads mixtape by ID
- **GET /** - Health check endpoint

## Quick Start

1. **Get R2 Credentials**
   - Create Cloudflare R2 bucket
   - Generate API tokens (read/write permissions)

2. **Configure**
   ```bash
   cp .env.example .env
   # Edit .env with your R2 credentials
   ```

3. **Install & Run**
   ```bash
   npm install
   npm start
   ```

## Environment Variables

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=moodybeats-mixtapes
PORT=3000
BASE_URL=https://share.moodybeats.sanyamchhabra.in
```

## Production Deployment

### Option 1: VPS/Cloud Server

```bash
# Install dependencies
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start src/index.js --name moodybeats-backend
pm2 save
pm2 startup

# Set up nginx reverse proxy + SSL
```

### Option 2: Docker

```bash
docker build -t moodybeats-backend .
docker run -d -p 3000:3000 --env-file .env moodybeats-backend
```

### Option 3: Cloudflare Workers (Recommended)

Best integration with R2 - see SETUP_GUIDE.md for details.

## API Endpoints

### Upload
```bash
curl -X POST https://share.moodybeats.sanyamchhabra.in/upload \
  -F "archive=@mixtape.mixblues"
```

Response:
```json
{
  "id": "abc123xyz",
  "url": "https://share.moodybeats.sanyamchhabra.in/t/abc123xyz"
}
```

### Download
```bash
curl https://share.moodybeats.sanyamchhabra.in/t/abc123xyz -o mixtape.mixblues
```

### Health Check
```bash
curl https://share.moodybeats.sanyamchhabra.in/
```

Response:
```json
{
  "service": "MoodyBeats API",
  "status": "running",
  "version": "1.0.0",
  "storage": "cloudflare-r2"
}
```

## Features

✅ Cloudflare R2 storage (S3-compatible)  
✅ Unique ID generation (nanoid)  
✅ File validation (.mixblues, .zip)  
✅ 100MB file size limit  
✅ CORS enabled  
✅ Error handling  
✅ Minimal dependencies  

## File Structure

```
moodybeats-backend/
├── src/
│   ├── index.js       # Main Express server
│   └── r2-client.js   # R2 storage client
├── package.json
├── .env.example
├── README.md
├── SETUP_GUIDE.md     # Detailed setup instructions
└── DEPLOYMENT.md      # This file
```

## Security Notes

- Server requires valid R2 credentials to start
- CORS set to `*` - restrict in production
- Consider adding rate limiting
- Monitor R2 usage and costs
- Set up proper logging/monitoring

## Cost Estimate

Cloudflare R2 (no egress fees):
- Storage: $0.015/GB/month
- Writes: $4.50/million
- Reads: $0.36/million

Example: 1000 mixtapes/month (5MB avg) ≈ $0.09/month

## Support

See SETUP_GUIDE.md for detailed instructions and troubleshooting.
