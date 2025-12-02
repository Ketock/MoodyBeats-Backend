# MoodyBeats Backend Setup Guide

This guide will help you deploy the MoodyBeats backend with Cloudflare R2 storage.

## Step 1: Create Cloudflare R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage** in the sidebar
3. Click **Create bucket**
4. Name your bucket: `moodybeats-mixtapes` (or your preferred name)
5. Click **Create bucket**

## Step 2: Generate R2 API Tokens

1. In the R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure the token:
   - **Token name:** `moodybeats-backend`
   - **Permissions:** Object Read & Write
   - **Bucket:** Select your bucket or choose "Apply to all buckets"
4. Click **Create API Token**
5. **Important:** Copy and save these credentials immediately:
   - Access Key ID
   - Secret Access Key
   - Account ID (found in the R2 dashboard URL or overview page)

## Step 3: Configure Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd moodybeats-backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your R2 credentials:
   ```env
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ACCESS_KEY_ID=your_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
   R2_BUCKET_NAME=moodybeats-mixtapes
   
   PORT=3000
   BASE_URL=https://share.moodybeats.sanyamchhabra.in
   ```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Test Locally

Start the server:
```bash
npm start
```

You should see:
```
🎵 MoodyBeats backend running on port 3000
📦 Using R2 bucket: moodybeats-mixtapes
🌐 Base URL: https://share.moodybeats.sanyamchhabra.in
```

Test the health endpoint:
```bash
curl http://localhost:3000/
```

Expected response:
```json
{
  "service": "MoodyBeats API",
  "status": "running",
  "version": "1.0.0",
  "storage": "cloudflare-r2"
}
```

## Step 6: Deploy to Production

### Option A: Deploy to a VPS/Cloud Server

1. **Set up your server** (Ubuntu/Debian example):
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Clone and configure:**
   ```bash
   git clone <your-repo>
   cd moodybeats-backend
   npm install --production
   
   # Create .env with your credentials
   nano .env
   ```

3. **Start with PM2:**
   ```bash
   pm2 start src/index.js --name moodybeats-backend
   pm2 save
   pm2 startup
   ```

4. **Set up reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name share.moodybeats.sanyamchhabra.in;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable HTTPS with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d share.moodybeats.sanyamchhabra.in
   ```

### Option B: Deploy to Cloudflare Workers (Recommended)

For better integration with R2, deploy as a Cloudflare Worker:

1. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Create `wrangler.toml`:
   ```toml
   name = "moodybeats-backend"
   main = "src/worker.js"
   compatibility_date = "2024-01-01"
   
   [[r2_buckets]]
   binding = "MIXTAPES"
   bucket_name = "moodybeats-mixtapes"
   ```

4. Convert Express app to Worker format (see Cloudflare Workers docs)

5. Deploy:
   ```bash
   wrangler deploy
   ```

### Option C: Deploy with Docker

1. Build the image:
   ```bash
   docker build -t moodybeats-backend .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 3000:3000 \
     --env-file .env \
     --name moodybeats-backend \
     moodybeats-backend
   ```

## Step 7: Update Main App

The main MoodyBeats app is already configured to use:
```
https://share.moodybeats.sanyamchhabra.in
```

Once your backend is deployed at this URL, the app will automatically connect to it.

## Monitoring

Monitor your backend using:
- Server logs: `pm2 logs moodybeats-backend` (if using PM2)
- R2 dashboard: Check storage usage and requests in Cloudflare dashboard
- Health endpoint: `curl https://share.moodybeats.sanyamchhabra.in/`

## Troubleshooting

### Server won't start
- Check that all R2 credentials are correct in `.env`
- Verify your R2 bucket exists
- Ensure API token has read/write permissions

### Upload fails
- Check R2 bucket permissions
- Verify CORS settings if uploading from web
- Check file size limits (default: 100MB)

### Download returns 404
- Verify the mixtape ID is correct
- Check that the file exists in R2 bucket
- Review server logs for errors

## Security Recommendations

1. **Restrict CORS origins** in production (not `*`)
2. **Add rate limiting** to prevent abuse
3. **Implement authentication** if needed
4. **Set up monitoring** and alerts
5. **Regular backups** of R2 bucket
6. **Use environment variables** for all secrets

## Cost Estimation

Cloudflare R2 pricing (as of 2024):
- Storage: $0.015/GB/month
- Class A operations (writes): $4.50/million
- Class B operations (reads): $0.36/million
- No egress fees!

Example: 1000 mixtapes/month (avg 5MB each):
- Storage: ~5GB = $0.08/month
- Uploads: 1000 = $0.0045
- Downloads: 5000 = $0.0018
- **Total: ~$0.09/month**

## Support

For issues or questions:
- Check the main README.md
- Review Cloudflare R2 documentation
- Check server logs: `pm2 logs moodybeats-backend`
