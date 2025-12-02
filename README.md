# MoodyBeats Backend API

Minimal backend server for MoodyBeats mixtape sharing with Cloudflare R2 storage.

## Features

- **POST /upload** - Upload mixtape archives (.mixblues files)
- **GET /t/:id** - Download mixtape archives by ID
- Cloudflare R2 integration for scalable object storage
- CORS enabled for web/mobile clients
- File validation and size limits (100MB max)
- Unique ID generation using nanoid

## Prerequisites

- Node.js 18 or higher
- Cloudflare account with R2 enabled
- R2 bucket created
- R2 API credentials

## Setup

### 1. Configure Cloudflare R2

1. Create a Cloudflare account and enable R2
2. Create an R2 bucket (e.g., `moodybeats-mixtapes`)
3. Generate R2 API tokens:
   - Go to R2 → Manage R2 API Tokens
   - Create API token with read/write permissions
   - Save the Access Key ID and Secret Access Key

### 2. Install Dependencies

```bash
cd moodybeats-backend
npm install
```

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your R2 credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=moodybeats-mixtapes

PORT=3000
BASE_URL=https://share.moodybeats.sanyamchhabra.in
```

**Important:** The server will not start without valid R2 credentials. Make sure all environment variables are properly configured.

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will validate R2 credentials on startup and exit if they're missing.

## API Endpoints

### Upload Mixtape

**POST /upload**

Upload a mixtape archive file.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form field `archive` with .mixblues file

**Response:**
```json
{
  "id": "abc123xyz",
  "url": "https://share.moodybeats.sanyamchhabra.in/t/abc123xyz"
}
```

**Example (curl):**
```bash
curl -X POST http://localhost:3000/upload \
  -F "archive=@mixtape.mixblues"
```

### Download Mixtape

**GET /t/:id**

Download a mixtape archive by ID.

**Request:**
- Method: `GET`
- URL: `/t/{mixtape_id}`

**Response:**
- Content-Type: `application/zip`
- Binary file data

**Example (curl):**
```bash
curl http://localhost:3000/t/abc123xyz -o downloaded.mixblues
```

### Health Check

**GET /**

Check if the server is running.

**Response:**
```json
{
  "service": "MoodyBeats API",
  "status": "running",
  "version": "1.0.0"
}
```

## Deployment

### Option 1: Traditional Server (VPS, EC2, etc.)

1. Clone repository to server
2. Install Node.js 18+
3. Set up environment variables
4. Install dependencies: `npm install`
5. Use PM2 or systemd to run: `npm start`
6. Configure reverse proxy (nginx/caddy) for HTTPS

### Option 2: Cloudflare Workers (Recommended)

For better integration with R2, consider deploying as a Cloudflare Worker:

1. Install Wrangler CLI: `npm install -g wrangler`
2. Convert Express routes to Worker format
3. Deploy: `wrangler deploy`

### Option 3: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t moodybeats-backend .
docker run -p 3000:3000 --env-file .env moodybeats-backend
```

## Security Considerations

- Set appropriate CORS origins in production (not `*`)
- Implement rate limiting for upload endpoint
- Add authentication if needed
- Set up CDN/caching for download endpoint
- Monitor R2 storage usage and costs
- Implement file expiration/cleanup if needed

## Requirements Satisfied

This backend satisfies the following MoodyBeats requirements:

- **12.5**: Backend API for mixtape sharing
- **13.1**: Upload endpoint with progress tracking support
- **13.2**: Download endpoint with unique URLs
- **17.1**: Upload response with ID and URL
- **17.2**: Download by ID
- **17.3**: Retry logic support (handled by client)
- **17.4**: Error handling for 404 and network errors
- **17.5**: Timeout handling (handled by client)

## License

Same as MoodyBeats main project.
