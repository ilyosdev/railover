# Railover Frequently Asked Questions (FAQ)

## General Questions

### What is Railover?

Railover is a self-hosted Platform as a Service (PaaS) that allows you to deploy and manage applications, databases, and services on your own VDS (Virtual Dedicated Server). It provides a Railway-like experience at a fraction of the cost.

### How is Railover different from Railway, Heroku, or Vercel?

| Feature           | Railover                | Railway/Heroku  | Vercel           |
| ----------------- | ----------------------- | --------------- | ---------------- |
| **Hosting**       | Self-hosted on your VDS | Cloud-hosted    | Cloud-hosted     |
| **Cost**          | $5-50/month (VDS cost)  | $200+/month     | $20-200+/month   |
| **Control**       | Full server access      | Limited         | Limited          |
| **Databases**     | Included, unlimited     | Paid add-ons    | Limited/External |
| **Team Size**     | Unlimited               | Limited by plan | Limited by plan  |
| **Customization** | Full control            | Limited         | Very limited     |

### What does "Railover" mean?

**Rail**way + **Over** = Railover. It's a play on words indicating we're building "over" (on top of) Railway's concept, but with full ownership and control.

### Is Railover free?

Railover itself is open-source and free. You only pay for:

- Your VDS (Virtual Dedicated Server) - typically $5-50/month
- Any domain names you want to use
- Optional: backups, monitoring services

### Is Railover production-ready?

Yes! Railover is based on CapRover, a battle-tested PaaS with thousands of production deployments. We've added multi-user/team features and Railway-like UX improvements.

## Installation & Setup

### What are the minimum requirements?

- **OS**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+
- **RAM**: 2GB minimum (4GB recommended)
- **CPU**: 1 vCPU (2+ recommended)
- **Disk**: 20GB minimum SSD
- **Ports**: 80, 443, 3000 must be accessible

### Which VDS providers do you recommend?

1. **Hetzner Cloud** - Best value (€4.15/month for CX21)
2. **DigitalOcean** - Great support ($6/month)
3. **Vultr** - Good performance ($6/month)
4. **Linode (Akamai)** - Reliable ($5/month)
5. **OVH** - European option (€3.50/month)

### Can I run Railover on AWS/GCP/Azure?

Yes! Railover works on any VDS/VPS with Docker support. However, budget providers (Hetzner, DigitalOcean) offer better value for money.

### How long does installation take?

- **Automated install**: 2-5 minutes
- **Manual setup**: 10-15 minutes
- **Full configuration (with domain, SSL)**: 15-20 minutes

### Do I need to know Docker?

No! Railover abstracts away Docker complexity. Just:

1. Install Railover (one command)
2. Use the web dashboard to deploy apps
3. Everything else is handled automatically

### Can I install Railover on an existing server?

Yes, but be careful:

- Railover needs Docker and will initialize Docker Swarm
- It uses ports 80, 443, 3000, 996, 2377, 4789, 7946
- It's recommended to use a fresh VDS to avoid conflicts

## Deployment

### What languages/frameworks are supported?

Railover supports anything that runs in Docker:

- **Node.js** (Express, NestJS, Next.js, etc.)
- **Python** (Django, Flask, FastAPI, etc.)
- **PHP** (Laravel, Symfony, WordPress, etc.)
- **Ruby** (Rails, Sinatra, etc.)
- **Go** (Gin, Echo, etc.)
- **Java** (Spring Boot, etc.)
- **Rust**, **Elixir**, **.NET**, and more!

### What databases are supported?

All popular databases:

- PostgreSQL
- MySQL/MariaDB
- MongoDB
- Redis
- CouchDB
- And any database with a Docker image

### How do I deploy my first app?

Three ways:

**1. From Git (easiest):**

```bash
Dashboard → Apps → Create App → Deploy from Git
```

**2. Using CLI:**

```bash
npm install -g caprover
caprover login
caprover deploy
```

**3. From Docker image:**

```bash
Dashboard → Apps → Create App → Deploy from Image
```

### Do I need a `Dockerfile`?

Not always! Railover supports multiple deployment methods:

1. **captain-definition** file (recommended):

    ```json
    {
        "schemaVersion": 2,
        "dockerfileLines": [
            "FROM node:18",
            "WORKDIR /app",
            "COPY . .",
            "RUN npm install",
            "CMD [\"npm\", \"start\"]"
        ]
    }
    ```

2. **Dockerfile**: Works out of the box

3. **Buildpacks**: Auto-detect your stack (coming soon)

### How do I add environment variables?

Dashboard → Apps → Your App → App Configs → Environment Variables

Or via CLI:

```bash
caprover deploy --envFile .env.production
```

### Can I use custom domains?

Yes! For each app:

1. Point your domain's A record to your server IP
2. Dashboard → Apps → Your App → HTTP Settings → Custom Domain
3. Add domain: `app.yourdomain.com`
4. Enable HTTPS (automatic SSL via Let's Encrypt)

### How do I enable SSL/HTTPS?

SSL is automatic with Railover:

1. Add your custom domain to the app
2. Enable "Enable HTTPS" in HTTP Settings
3. Railover automatically requests and installs Let's Encrypt certificate
4. Certificate auto-renews every 60 days

## Team & Collaboration

### Can multiple people use Railover?

Yes! Railover supports multi-user teams with role-based access:

- **Admin**: Full access to everything
- **Developer**: Can deploy and manage apps
- **Viewer**: Read-only access

### How do I add team members?

Dashboard → Team → Team Management → Add Team Member

Set their:

- Username
- Email
- Password
- Role (admin/developer/viewer)

### Can I restrict access to specific projects?

Yes! Each project can have specific team members assigned. Go to:

- Dashboard → Projects → Your Project → Collaborators
- Add team members with specific roles

### Is there an audit log?

Basic logging is available in:

- App deployment history
- System logs: `docker logs captain-captain`

Full audit logging is planned for future versions.

## Cost & Performance

### How much does it really cost?

**Monthly costs:**

- Hetzner CX21 (4GB RAM): €4.15/month
- Hetzner CX31 (8GB RAM): €8.19/month
- DigitalOcean Basic (4GB): $24/month
- Domain (optional): $10-15/year

**Total: $5-50/month** depending on your needs

Compare to Railway: $200+/month for team usage

### How many apps can I run?

Depends on your VDS resources:

**Example: 4GB RAM VDS**

- 5-10 small apps (Node.js, static sites)
- 2-3 medium apps (Python/Django, PHP/Laravel)
- 1-2 large apps (with databases)

**Example: 8GB RAM VDS**

- 10-20 small apps
- 5-7 medium apps
- 3-4 large apps with databases

### Will my apps be as fast as on Railway?

Performance depends on:

1. **VDS specs**: Better specs = better performance
2. **VDS location**: Choose close to your users
3. **Network**: Hetzner/DO have excellent networks

In most cases, performance is equal or better than Railway because:

- You control the resources
- No "noisy neighbors" on shared hosting
- You can upgrade anytime

### Can I scale horizontally (multiple servers)?

Yes! Railover uses Docker Swarm, which supports:

- Multiple worker nodes
- Load balancing across nodes
- High availability setups

To add a worker node:

```bash
docker swarm join-token worker
```

Then run the token on your new server.

## Databases

### How do I create a database?

1. Dashboard → Services → Create Service
2. Select database type (PostgreSQL, MySQL, etc.)
3. Configure name and version
4. Click "Create"

### How do I connect my app to a database?

After creating a database service:

1. Go to service settings to get connection details
2. Add to your app as environment variables:
    ```
    DATABASE_URL=postgresql://user:pass@db:5432/mydb
    ```

### Are databases backed up automatically?

By default, no. You need to:

**Option 1**: Use Railover's backup feature

```bash
docker exec captain-captain captain backup
```

**Option 2**: Database-specific backups

- PostgreSQL: `pg_dump`
- MySQL: `mysqldump`
- MongoDB: `mongodump`

**Option 3**: VDS snapshots (recommended)

- Hetzner/DigitalOcean offer automatic snapshots
- Takes snapshot of entire server

### Can I use external databases?

Yes! You can connect to:

- Managed databases (AWS RDS, DigitalOcean Managed DBs)
- External MongoDB Atlas, Supabase, etc.
- Any database accessible via network

Just add the connection string as an environment variable.

## Security

### Is Railover secure?

Yes, when configured properly:

- ✅ All traffic can be encrypted (SSL/TLS)
- ✅ Docker isolation between apps
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ Regular security updates (update frequently!)

### Should I change the default password?

**Absolutely!** Change it immediately after first login:

- Dashboard → Settings → Change Password
- Use a strong password (12+ characters)

### Do I need a firewall?

Yes! Enable UFW or iptables:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### Can I use 2FA (Two-Factor Authentication)?

Not yet, but it's planned for future releases. For now:

- Use strong passwords
- Limit admin access
- Use VPN or IP whitelisting for dashboard access

### How do I secure the Railover dashboard?

1. **Use HTTPS**: Add a custom domain with SSL
2. **Change default password**: Immediately!
3. **Restrict access**: Use firewall rules to limit IP access
4. **Regular updates**: Keep Railover updated
5. **Strong passwords**: For all team members

## Backup & Recovery

### How do I backup Railover?

**Method 1**: Backup data directory

```bash
tar czf railover-backup.tar.gz /opt/railover/data
```

**Method 2**: Use Railover's built-in backup

```bash
docker exec captain-captain captain backup --backupFile /captain/data/backup.tar
```

**Method 3**: VDS snapshots (easiest)

- Use your provider's snapshot feature
- Hetzner: Dashboard → Snapshots → Create
- DigitalOcean: Droplet → Snapshots → Take snapshot

### What gets backed up?

When you backup `/opt/railover/data`, you backup:

- All app configurations
- SSL certificates
- Database data (if using Railover-managed databases)
- Registry images
- Nginx configurations
- Let's Encrypt certificates

### How do I restore from backup?

```bash
tar xzf railover-backup.tar.gz -C /

docker restart captain-captain
```

Or use VDS snapshot restore from your provider's dashboard.

### Should I backup regularly?

Yes! Recommended schedule:

- **Daily**: Automated backups
- **Before updates**: Manual backup
- **Weekly**: VDS snapshot

## Troubleshooting

### Railover won't start after installation

```bash
docker logs captain-captain

sudo netstat -tulpn | grep -E ':(80|443|3000)'
```

Common issues:

- Port already in use (Apache, Nginx running)
- Insufficient RAM
- Firewall blocking ports

### Can't access dashboard at port 3000

1. Check if container is running:

    ```bash
    docker ps | grep captain-captain
    ```

2. Check firewall:

    ```bash
    sudo ufw status
    sudo ufw allow 3000/tcp
    ```

3. Check from server:
    ```bash
    curl http://localhost:3000
    ```

### SSL certificate not working

1. **Verify DNS**:

    ```bash
    dig your-domain.com
    ```

2. **Check port 80** (required for Let's Encrypt):

    ```bash
    sudo ufw allow 80/tcp
    ```

3. **Check logs**:

    ```bash
    docker logs captain-captain | grep certbot
    ```

4. **Wait**: Certificates can take 1-2 minutes

### App deployment failed

1. **Check build logs** in deployment history
2. **Common issues**:

    - Missing `Dockerfile` or `captain-definition`
    - Wrong Node.js/Python version
    - Missing dependencies in package.json
    - Port not exposed correctly

3. **Debug**:
    ```bash
    docker logs <app-container-name>
    ```

### Out of disk space

1. **Clean Docker**:

    ```bash
    docker system prune -a
    ```

2. **Check usage**:

    ```bash
    df -h
    du -sh /opt/railover/data/*
    ```

3. **Upgrade VDS** or add volume

## Migration & Integration

### Can I migrate from Railway?

Yes! See our [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for step-by-step instructions.

The process:

1. Export Railway environment variables
2. Deploy apps to Railover
3. Migrate databases
4. Update DNS
5. Test thoroughly
6. Shut down Railway

### Can I use Railover with CI/CD?

Yes! Integrate with:

**GitHub Actions:**

```yaml
- name: Deploy to Railover
  run: |
      npm install -g caprover
      caprover deploy
  env:
      CAPROVER_URL: ${{ secrets.CAPROVER_URL }}
      CAPROVER_PASSWORD: ${{ secrets.CAPROVER_PASSWORD }}
```

**GitLab CI:**

```yaml
deploy:
    script:
        - npm install -g caprover
        - caprover deploy
```

### Can I use Railover with monitoring tools?

Yes! Railover has built-in:

- **NetData**: System monitoring (enable in settings)
- **GoAccess**: Web analytics

External tools:

- **Prometheus**: Scrape Docker metrics
- **Grafana**: Visualization
- **Sentry**: Error tracking
- **Datadog/New Relic**: APM (via agents in your apps)

## Updates & Maintenance

### How do I update Railover?

**Easiest way:**

```bash
curl -fsSL https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/update.sh | sudo bash
```

**Manual way:**

```bash
docker pull ilyosdev/railover:latest
docker stop captain-captain
docker rm captain-captain
docker run -d [same parameters as install]
```

### How often should I update?

- **Security updates**: Immediately
- **Feature updates**: Monthly
- **Server updates**: Weekly (`apt update && apt upgrade`)

### Will updating break my apps?

No! Updates only affect Railover itself. Your apps continue running.

However:

- Always backup before updating
- Test in staging if possible
- Read changelog for breaking changes

### How do I rollback an update?

If you backed up before updating:

```bash
docker stop captain-captain
docker rm captain-captain

tar xzf railover-backup.tar.gz -C /

docker run -d [previous version]
```

Or restore from VDS snapshot.

## Support

### Where can I get help?

1. **Documentation**: Start here - most questions are answered
2. **GitHub Issues**: https://github.com/ilyosdev/railover/issues
3. **Discord**: https://discord.gg/railover
4. **Email**: support@railover.com

### Is there paid support?

Not yet, but we're planning:

- **Priority Support**: Faster response times
- **Managed Railover**: We manage your installation
- **Custom Development**: Features for your team

### Can I contribute to Railover?

Yes! We welcome:

- Bug reports
- Feature requests
- Pull requests
- Documentation improvements
- Translations

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### How can I report a security issue?

**DO NOT** open a public GitHub issue.

Email: security@railover.com

We'll respond within 24 hours.

---

**Still have questions?**

- 📖 Read the [full documentation](INSTALL.md)
- 💬 Join our [Discord community](https://discord.gg/railover)
- 🐛 [Open an issue](https://github.com/ilyosdev/railover/issues)
- 📧 Email us at support@railover.com
