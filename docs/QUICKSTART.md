# Railover Quickstart Guide

Get up and running with Railover in 5 minutes!

## What is Railover?

Railover is a self-hosted PaaS (Platform as a Service) that lets you deploy applications like you would on Railway or Heroku, but on your own VDS for a fraction of the cost.

**Cost Comparison:**

- Railway: ~$200/month for team projects
- Railover on Hetzner VDS: ~$5-50/month
- **Savings: 75-95%**

## Prerequisites

You need:

1. A VDS (Virtual Dedicated Server) with:
    - Ubuntu 20.04+ or Debian 11+
    - At least 2GB RAM
    - At least 20GB disk space
    - Root access

**Recommended VDS Providers:**

- **Hetzner Cloud** - €4.15/month (CX21)
- **DigitalOcean** - $6/month (Basic Droplet)
- **Vultr** - $6/month (Cloud Compute)

## Installation (1 minute)

SSH into your VDS and run:

```bash
curl -fsSL https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh | sudo bash
```

That's it! The script will:

- Install Docker automatically
- Set up everything you need
- Generate a secure password
- Start Railover

## First Login (30 seconds)

1. Open your browser and go to: `http://YOUR_SERVER_IP:3000`
2. Login with:
    - Username: `admin`
    - Password: (shown in installation output)
3. Change your password in Settings

## Set Up Domain (Optional, 2 minutes)

Having a domain enables automatic SSL certificates:

1. **Point your domain to your server:**

    ```
    A record: railover.yourdomain.com → YOUR_SERVER_IP
    ```

2. **Configure in Railover:**

    - Settings → Domains
    - Enter: `railover.yourdomain.com`
    - Enable HTTPS
    - Enter your email
    - Click "Update Domain"

3. **Wait 1-2 minutes** for SSL certificate
4. Access at: `https://railover.yourdomain.com`

## Deploy Your First App (3 minutes)

### Option 1: From Git Repository

1. **Create a project:**

    - Dashboard → Projects → "Create Project"
    - Name: "My First Project"
    - Click "Create"

2. **Create an app:**

    - Inside project → Apps → "Create New App"
    - Name: "my-app"
    - Click "Create"

3. **Deploy from Git:**

    - App Settings → Deployment
    - Method: Git Repository
    - URL: `https://github.com/your-username/your-app`
    - Branch: `main`
    - Click "Deploy Now"

4. **Wait for build** (1-2 minutes)
5. **Access your app** at: `http://my-app.your-domain.com`

### Option 2: Using Railover CLI

```bash
npm install -g caprover

cd your-app-directory

caprover login

caprover deploy
```

### Example: Deploy a Node.js App

```bash
mkdir my-node-app
cd my-node-app

npm init -y

npm install express

echo 'const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello from Railover!");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});' > index.js

echo '{
  "schemaVersion": 2,
  "dockerfileLines": [
    "FROM node:18-alpine",
    "WORKDIR /app",
    "COPY package*.json ./",
    "RUN npm install",
    "COPY . .",
    "CMD [\"node\", \"index.js\"]"
  ]
}' > captain-definition

git init
git add .
git commit -m "Initial commit"
```

Then deploy via Railover dashboard or CLI.

## Add a Database (1 minute)

1. **In your project** → Services → "Create Service"
2. **Select database type:**
    - PostgreSQL
    - MySQL
    - MongoDB
    - Redis
3. **Configure:**
    - Name: `my-database`
    - Version: Latest
    - Click "Create"
4. **Get connection details** from service settings
5. **Add to your app** as environment variable

## Invite Team Members (1 minute)

1. **Team** → **Team Management**
2. **Add Team Member:**
    - Username: `john.doe`
    - Email: `john@example.com`
    - Role: `developer` or `viewer`
    - Click "Create"
3. **Share credentials** with your team

## Common Tasks

### View App Logs

Dashboard → Apps → Your App → Logs

### Set Environment Variables

Dashboard → Apps → Your App → App Configs → Environment Variables

### Enable SSL for App

Dashboard → Apps → Your App → HTTP Settings → Enable HTTPS

### Scale App

Dashboard → Apps → Your App → App Configs → Instance Count

### Add Custom Domain

Dashboard → Apps → Your App → HTTP Settings → Custom Domain

## Migration from Railway

If you're moving from Railway to Railover:

1. **Export your environment variables** from Railway
2. **Create app in Railover** with same name
3. **Import environment variables**
4. **Deploy from same Git repository**
5. **Update DNS** to point to Railover
6. **Test thoroughly** before shutting down Railway

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed instructions.

## Quick Reference

### Useful Commands

```bash
docker logs -f captain-captain

docker restart captain-captain

docker stats captain-captain

docker exec -it captain-captain sh
```

### Important Directories

- **Data**: `/opt/railover/data`
- **Config**: `/opt/railover/data/config-override.json`
- **SSL Certs**: `/opt/railover/data/letencrypt/`
- **App Data**: `/opt/railover/data/appData/`

### Ports Used

- `80` - HTTP traffic
- `443` - HTTPS traffic
- `3000` - Railover dashboard
- `996` - Docker registry
- `2377`, `7946`, `4789` - Docker Swarm

## Tips for Success

### 1. Use Environment Variables

Never hardcode secrets. Use environment variables for:

- Database passwords
- API keys
- Third-party service credentials

### 2. Enable SSL Everywhere

- Use custom domains with HTTPS
- Force HTTPS in app settings
- Let's Encrypt is free and automatic

### 3. Regular Backups

```bash
tar czf railover-backup-$(date +%Y%m%d).tar.gz /opt/railover/data
```

### 4. Monitor Resource Usage

```bash
docker stats
```

If you're consistently near limits, upgrade your VDS.

### 5. Use Projects for Organization

- One project per client/product
- Keeps databases and apps organized
- Easier team access management

### 6. Keep Railover Updated

```bash
docker pull ilyosdev/railover:latest
docker restart captain-captain
```

## Troubleshooting

### Can't access dashboard?

```bash
docker ps | grep captain-captain

sudo ufw allow 3000/tcp

curl http://localhost:3000
```

### App won't deploy?

- Check app logs for errors
- Verify `captain-definition` or `Dockerfile` exists
- Ensure all dependencies are in `package.json`/`requirements.txt`

### SSL not working?

- Verify DNS is pointing to your server: `dig your-domain.com`
- Check Let's Encrypt logs: `docker logs captain-captain | grep certbot`
- Ensure port 80 is open (required for certificate validation)

### Out of memory?

- Check usage: `docker stats`
- Upgrade VDS or reduce app instances
- Increase swap: `sudo fallocate -l 2G /swapfile`

## Next Steps

1. **Read full documentation**: [INSTALL.md](INSTALL.md)
2. **Join our community**: https://discord.gg/railover
3. **Star us on GitHub**: https://github.com/ilyosdev/railover
4. **Share your experience** on Twitter/X with #Railover

## Get Help

- **Documentation**: https://docs.railover.com
- **GitHub Issues**: https://github.com/ilyosdev/railover/issues
- **Discord**: https://discord.gg/railover
- **Email**: support@railover.com

---

**Welcome to Railover!** 🚀

Save money. Keep control. Deploy with confidence.
