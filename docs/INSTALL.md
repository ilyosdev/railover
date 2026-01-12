# Railover Installation Guide

Deploy your own Railway-like PaaS on any VDS for $50/month instead of $200/month!

## Quick Start (One Command)

```bash
curl -fsSL https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh | sudo bash
```

That's it! 🎉

## System Requirements

### Minimum Requirements

- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, Fedora 35+
- **RAM**: 2GB minimum (4GB recommended for production)
- **CPU**: 1 vCPU (2+ vCPU recommended)
- **Disk**: 20GB minimum (SSD recommended)
- **Ports**: 80, 443, 3000, 996, 2377, 4789, 7946 (must be open)

### Recommended VDS Providers

- **Hetzner Cloud**: Starting at €4.15/month (CX21: 2 vCPU, 4GB RAM, 40GB SSD)
- **DigitalOcean**: Starting at $6/month (Basic Droplet: 1 vCPU, 1GB RAM)
- **Vultr**: Starting at $6/month (Cloud Compute: 1 vCPU, 1GB RAM)
- **Linode**: Starting at $5/month (Nanode: 1 vCPU, 1GB RAM)

## Installation Methods

### Method 1: One-Line Install (Recommended)

This is the easiest way to install Railover. The script will automatically:

- Detect your OS and version
- Install Docker and Docker Compose if needed
- Initialize Docker Swarm
- Create data directories
- Generate a secure admin password
- Start Railover

```bash
curl -fsSL https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh | sudo bash
```

### Method 2: Manual Install with Script

```bash
wget https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

### Method 3: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
    railover:
        image: ilyosdev/railover:latest
        container_name: captain-captain
        restart: unless-stopped

        ports:
            - '80:80'
            - '443:443'
            - '3000:3000'
            - '996:996'
            - '7946:7946'
            - '4789:4789'
            - '2377:2377'

        volumes:
            - railover-data:/captain/data
            - /var/run/docker.sock:/var/run/docker.sock

        environment:
            - CAPTAIN_ADMIN_PASSWORD=${RAILOVER_PASSWORD:-changeme123}
            - CAPTAIN_DEFAULT_EMAIL=${RAILOVER_DEFAULT_EMAIL:-admin@railover.local}

volumes:
    railover-data:
        driver: local
```

Set your password and start:

```bash
export RAILOVER_PASSWORD=your-secure-password
export RAILOVER_DEFAULT_EMAIL=your-email@example.com
mkdir -p /opt/railover/data
docker-compose up -d
```

### Method 4: Direct Docker Run

```bash
mkdir -p /opt/railover/data

docker run -d \
    --name captain-captain \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -p 3000:3000 \
    -p 996:996 \
    -p 7946:7946 \
    -p 4789:4789 \
    -p 2377:2377 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /opt/railover/data:/captain/data \
    -e CAPTAIN_ADMIN_PASSWORD=your-secure-password \
    ilyosdev/railover:latest
```

## First Login

1. **Open your browser**: Navigate to `http://your-server-ip:3000`
2. **Login with default credentials**:
    - Username: `admin`
    - Password: Check installation output or `docker logs captain-captain | grep "password"`
3. **Change your password immediately**:
    - Go to Settings → Change Password
    - Use a strong password with at least 12 characters

## Post-Installation Setup

### 1. Configure Domain (Recommended)

Adding a domain enables automatic SSL certificates:

1. **Point your domain to your server**:

    ```bash
    # Example DNS records
    A    railover.yourdomain.com    YOUR_SERVER_IP
    ```

2. **Enable HTTPS in Railover**:

    - Login to Railover dashboard
    - Go to Settings → Domains
    - Enter your domain: `railover.yourdomain.com`
    - Check "Enable HTTPS" and "Force HTTPS"
    - Enter your email for Let's Encrypt notifications
    - Click "Update Domain"

3. **Wait for SSL certificate** (1-2 minutes):
    - Railover will automatically request and install an SSL certificate
    - Once complete, access your dashboard at `https://railover.yourdomain.com`

### 2. Configure Firewall

Ensure required ports are open:

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 996/tcp
sudo ufw allow 2377/tcp
sudo ufw allow 4789/udp
sudo ufw allow 7946/tcp
sudo ufw allow 7946/udp
sudo ufw enable
```

Or for iptables:

```bash
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 996 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 2377 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 4789 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 7946 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 7946 -j ACCEPT
```

### 3. Create Your First Project

1. **Login to dashboard** at `http://your-server-ip:3000`
2. **Create a project**:

    - Click "Projects" → "Create Project"
    - Enter project name (e.g., "my-app")
    - Add description (optional)
    - Click "Create"

3. **Add services to your project**:
    - **Database**: PostgreSQL, MySQL, MongoDB, Redis
    - **Backend**: Node.js, Python, Go, PHP, Ruby
    - **Frontend**: React, Vue, Next.js, Static sites

### 4. Invite Team Members (Optional)

1. Go to **Team** → **Team Management**
2. Click **"Add Team Member"**
3. Fill in details:
    - **Username**: e.g., `john.doe`
    - **Email**: e.g., `john@example.com`
    - **Password**: Auto-generated or custom
    - **Role**:
        - `admin` - Full access to all projects
        - `developer` - Can deploy and manage services
        - `viewer` - Read-only access
4. Click **"Create User"**
5. Share credentials with your team member

## Deploying Your First App

### Example: Deploy a Node.js App

1. **Create app in Railover**:

    ```bash
    # In your project, click "Apps" → "Create New App"
    # App name: my-nodejs-app
    # Check "Has Persistent Data" if you need volumes
    ```

2. **Deploy from Git**:

    ```bash
    # In app settings, go to "Deployment"
    # Method: Git
    # Repository: https://github.com/yourusername/your-app.git
    # Branch: main
    # Click "Deploy Now"
    ```

3. **Deploy using CLI**:

    ```bash
    npm install -g caprover
    caprover login
    caprover deploy
    ```

4. **Add environment variables** (if needed):

    - Go to app → "App Configs" → "Environment Variables"
    - Add your variables (e.g., `DATABASE_URL`, `API_KEY`)

5. **Access your app**:
    - By default: `http://my-nodejs-app.your-domain.com`
    - Enable HTTPS in app settings for SSL

## Updating Railover

### Update via Docker Compose

```bash
cd /opt/railover
docker-compose pull
docker-compose up -d
```

### Update via Docker

```bash
docker pull ilyosdev/railover:latest
docker stop captain-captain
docker rm captain-captain
docker run -d \
    --name captain-captain \
    --restart unless-stopped \
    -p 80:80 -p 443:443 -p 3000:3000 \
    -p 996:996 -p 7946:7946 -p 4789:4789 -p 2377:2377 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /opt/railover/data:/captain/data \
    ilyosdev/railover:latest
```

### One-liner Update

```bash
docker pull ilyosdev/railover:latest && docker stop captain-captain && docker rm captain-captain && docker run -d --name captain-captain --restart unless-stopped -p 80:80 -p 443:443 -p 3000:3000 -p 996:996 -p 7946:7946 -p 4789:4789 -p 2377:2377 -v /var/run/docker.sock:/var/run/docker.sock -v /opt/railover/data:/captain/data ilyosdev/railover:latest
```

## Backup and Restore

### Backup All Data

Railover stores all data in `/opt/railover/data`. Back up this directory:

```bash
tar czf railover-backup-$(date +%Y%m%d).tar.gz /opt/railover/data
```

Or use Railover's built-in backup:

```bash
docker exec captain-captain captain backup --backupFile /captain/data/backup-$(date +%Y%m%d).tar
```

### Restore from Backup

```bash
tar xzf railover-backup-YYYYMMDD.tar.gz -C /

docker restart captain-captain
```

Or restore using Railover CLI:

```bash
docker exec captain-captain captain restore --backupFile /captain/data/backup-YYYYMMDD.tar
```

## Troubleshooting

### Container Won't Start

```bash
docker logs captain-captain
```

Check for port conflicts:

```bash
sudo netstat -tulpn | grep -E ':(80|443|3000)'
```

### Can't Access Dashboard

1. **Check if container is running**:

    ```bash
    docker ps | grep captain-captain
    ```

2. **Check firewall**:

    ```bash
    sudo ufw status
    ```

3. **Check server IP**:
    ```bash
    curl ifconfig.me
    ```

### SSL Certificate Issues

1. **Check DNS propagation**:

    ```bash
    dig railover.yourdomain.com
    nslookup railover.yourdomain.com
    ```

2. **Check Let's Encrypt logs**:

    ```bash
    docker logs captain-captain | grep certbot
    ```

3. **Verify email is correct** in Railover settings

### Performance Issues

1. **Check resource usage**:

    ```bash
    docker stats captain-captain
    ```

2. **Increase memory limit** in `docker-compose.yml`:

    ```yaml
    deploy:
        resources:
            limits:
                memory: 4G
    ```

3. **Upgrade your VDS plan** if consistently hitting limits

### App Won't Deploy

1. **Check app logs**:

    - Dashboard → Apps → Your App → App Logs

2. **Verify Dockerfile** or `captain-definition` file exists

3. **Check build logs** in deployment history

## Uninstall

```bash
docker stop captain-captain
docker rm captain-captain

docker rmi ilyosdev/railover:latest

sudo rm -rf /opt/railover
```

## CLI Installation

Install the Railover CLI for easier app deployment:

```bash
npm install -g caprover

caprover login

caprover deploy
```

## Comparison: Railway vs Railover

| Feature             | Railway (Cloud)  | Railover (Self-Hosted) |
| ------------------- | ---------------- | ---------------------- |
| **Cost**            | $200+/month      | $5-50/month (VDS cost) |
| **Setup Time**      | 0 minutes        | 5 minutes              |
| **Full Control**    | No               | Yes                    |
| **Custom Domains**  | Yes              | Yes (free SSL)         |
| **Databases**       | Yes (paid extra) | Yes (included)         |
| **Team Management** | Yes              | Yes                    |
| **Auto-scaling**    | Yes              | Manual                 |
| **Uptime SLA**      | 99.9%            | Depends on VDS         |

## Support and Resources

- **Documentation**: https://docs.railover.com
- **GitHub Issues**: https://github.com/ilyosdev/railover/issues
- **Discord Community**: https://discord.gg/railover
- **Email Support**: support@railover.com

## License

Railover is open source software licensed under the Apache License 2.0.

---

Happy deploying! 🚀
