# Railover Installation Scripts

This directory contains installation and maintenance scripts for Railover VDS PaaS.

## Available Scripts

### install.sh

Automated installation script for Railover on fresh VDS servers.

**Supports:**

- Ubuntu 20.04+
- Debian 11+
- CentOS 8+
- RHEL 8+
- Fedora 35+

**Features:**

- Auto-detects OS and version
- Installs Docker and Docker Compose if missing
- Initializes Docker Swarm
- Configures firewall rules
- Generates secure admin password
- Sets up data directories
- Pulls and starts Railover container

**Usage:**

```bash
curl -fsSL https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh | sudo bash
```

Or download and run manually:

```bash
wget https://raw.githubusercontent.com/ilyosdev/railover/main/scripts/install.sh
chmod +x install.sh
sudo ./install.sh
```

**Custom password:**

```bash
export RAILOVER_PASSWORD=your-custom-password
sudo ./install.sh
```

**What it does:**

1. Checks system requirements (RAM, disk space)
2. Installs Docker if not present
3. Installs Docker Compose if not present
4. Initializes Docker Swarm
5. Creates `/opt/railover/data` directory
6. Generates random admin password (or uses provided)
7. Pulls `ilyosdev/railover:latest` image
8. Starts Railover container
9. Displays login credentials and next steps

**Post-installation:**

After successful installation, you'll see:

- Dashboard URL: `http://your-server-ip:3000`
- Admin username: `admin`
- Admin password: (shown in output)

## Future Scripts

More scripts will be added for:

- `update.sh` - Update Railover to latest version
- `backup.sh` - Backup all Railover data
- `restore.sh` - Restore from backup
- `migrate.sh` - Migrate from other platforms
- `uninstall.sh` - Clean uninstallation

## Contributing

If you'd like to add support for other operating systems or improve the installation process, please submit a pull request!

## Support

For issues with installation, please create an issue at:
https://github.com/ilyosdev/railover/issues
