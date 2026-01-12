# GitHub Integration Setup Guide

Railover supports GitHub OAuth integration for automatic deployments. This guide shows how to set it up.

## Features

- **Connect GitHub Account** - One-click OAuth connection
- **List Repositories** - Browse your repos from Railover dashboard
- **Auto-Deploy on Push** - Webhook triggers deployment when you push
- **Branch Selection** - Deploy from any branch

---

## Step 1: Create GitHub OAuth App

1. Go to **GitHub** → **Settings** → **Developer settings** → **OAuth Apps**
   
   Direct link: https://github.com/settings/developers

2. Click **"New OAuth App"**

3. Fill in the form:

   | Field | Value |
   |-------|-------|
   | **Application name** | `Railover` (or any name) |
   | **Homepage URL** | `https://captain.yourdomain.com` |
   | **Authorization callback URL** | `https://captain.yourdomain.com/#/github-callback` |

4. Click **"Register application"**

5. Copy the **Client ID**

6. Click **"Generate a new client secret"** and copy it

---

## Step 2: Configure Railover

### Option A: Environment Variables (Recommended)

Add these to your Railover deployment:

```bash
# If using Docker service
docker service update \
  --env-add GITHUB_CLIENT_ID=your_client_id_here \
  --env-add GITHUB_CLIENT_SECRET=your_client_secret_here \
  --env-add GITHUB_REDIRECT_URI=https://captain.yourdomain.com/#/github-callback \
  captain-captain
```

### Option B: Docker Compose

```yaml
version: '3'
services:
  captain:
    image: ilyosdev/railover:dev
    environment:
      - GITHUB_CLIENT_ID=your_client_id_here
      - GITHUB_CLIENT_SECRET=your_client_secret_here
      - GITHUB_REDIRECT_URI=https://captain.yourdomain.com/#/github-callback
    # ... other config
```

### Option C: Docker Run

```bash
docker run -d \
  --name captain-captain \
  -e GITHUB_CLIENT_ID=your_client_id_here \
  -e GITHUB_CLIENT_SECRET=your_client_secret_here \
  -e GITHUB_REDIRECT_URI=https://captain.yourdomain.com/#/github-callback \
  -p 80:80 -p 443:443 -p 3000:3000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /captain-data:/captain-data \
  ilyosdev/railover:dev
```

---

## Step 3: Connect GitHub in Dashboard

1. Login to Railover dashboard
2. Go to **Settings** → **GitHub** (or Project Settings)
3. Click **"Connect GitHub"**
4. Authorize the OAuth app
5. You're connected!

---

## Step 4: Connect Repository to App

1. Go to your **App** → **Deployment** tab
2. Click **"Connect GitHub Repository"**
3. Select repository from list
4. Choose branch (default: `main`)
5. Click **Connect**

The webhook is automatically created. Now every push triggers a deployment!

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v2/user/github/auth-url` | Get OAuth URL |
| GET | `/api/v2/user/github/status` | Check connection status |
| POST | `/api/v2/user/github/callback` | OAuth callback handler |
| POST | `/api/v2/user/github/disconnect` | Disconnect GitHub |
| GET | `/api/v2/user/github/repos` | List user's repositories |
| GET | `/api/v2/user/github/repos/:owner/:repo/branches` | List branches |
| POST | `/api/v2/user/github/connect-repo` | Connect repo to app |

---

## How Auto-Deploy Works

```
[You push to GitHub]
        ↓
[GitHub sends webhook]
        ↓
[Railover receives webhook at /api/v2/user/apps/webhooks/triggerbuild]
        ↓
[Build starts automatically]
        ↓
[App is deployed]
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | Yes | OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes | OAuth App Client Secret |
| `GITHUB_REDIRECT_URI` | Yes | Callback URL (must match OAuth app settings) |

---

## Troubleshooting

### "GitHub OAuth is not configured"

Environment variables not set. Check:
```bash
docker service inspect captain-captain | grep -A5 GITHUB
```

### "Failed to get access token"

- Verify `GITHUB_CLIENT_SECRET` is correct
- Check `GITHUB_REDIRECT_URI` matches exactly what's in GitHub OAuth app settings

### Webhook not triggering

1. Check webhook was created: GitHub repo → Settings → Webhooks
2. Check webhook URL points to your Railover domain
3. Check Railover is accessible from internet

### "Repository not found" when listing repos

- Your GitHub token may have expired
- Disconnect and reconnect GitHub

---

## Security Notes

- **Client Secret** is stored securely and never exposed to frontend
- **Access Token** is stored in CapRover's config (encrypted if configured)
- Webhooks use secure HTTPS
- Token has limited scope: `repo`, `admin:repo_hook`, `read:user`

---

## Manual Webhook Setup (Alternative)

If you prefer manual webhook setup instead of OAuth:

1. Go to your GitHub repo → **Settings** → **Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Payload URL**: `https://captain.yourdomain.com/api/v2/user/apps/webhooks/triggerbuild?namespace=captain&token=YOUR_APP_TOKEN`
   - **Content type**: `application/json`
   - **Events**: Just the push event
4. Get `YOUR_APP_TOKEN` from: App → Deployment → App Tokens

This method doesn't require OAuth but requires manual setup per app.
