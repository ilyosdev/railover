<div align="center">
<h1>Railover</h1>

<p>
  <b>Deploy multiple projects on your own VDS for $50/month instead of $200/month on Railway</b>
</p>

<p>
  <a href="https://hub.docker.com/r/ilyosdev/railover" target="_blank">
    <img src="https://img.shields.io/docker/pulls/ilyosdev/railover.svg" alt="Docker Pulls"/>
  </a>
  <a href="https://github.com/ilyosdev/railover/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/ilyosdev/railover" alt="GitHub Stars"/>
  </a>
</p>
</div>

---

## 🚀 What is Railover?

**Railover** is a self-hosted PaaS (Platform as a Service) that lets you deploy and manage multiple projects on your own VDS. It provides a Railway.app-like developer experience at a fraction of the cost.

### Why Railover?

- 💰 **Cost Effective**: Host 10+ projects for $50/month vs $200/month on Railway
- 🎯 **Railway-like UX**: Project-centric dashboard, service types, one-click databases
- 👥 **Team Support**: Multi-user with role-based access control
- 🔐 **Self-Hosted**: Your data, your servers, full control
- 🐳 **Docker Native**: Deploy any app that runs in Docker
- 🔄 **Auto-Deploy**: GitHub integration with push-to-deploy

### Perfect For

- ✅ Startups managing multiple projects
- ✅ Agencies hosting client applications
- ✅ Developers wanting Railway UX without Railway costs
- ✅ Teams needing isolated development environments

---

## 🎯 Key Features

### Project Management

- 📊 Unified project dashboard for all your services
- 🗂 Services organized by type (Frontend, Backend, Database, Worker)
- 🔗 Visual service connections and dependencies
- 📝 Hierarchical environment variables (project + service level)

### Team Support

- 👥 Multi-user access with authentication
- 🔑 Role-based permissions (Super Admin, Admin, Developer, Viewer)
- 📋 Project-level access control
- 🛡️ Secure team collaboration

### Deployment

- 🚀 One-click database creation (PostgreSQL, MySQL, Redis, MongoDB)
- 📦 Docker container deployment
- 🔌 GitHub integration with webhooks
- 📜 Build logs and deployment history

### Infrastructure

- 💾 Persistent volumes for databases
- 🔒 SSL certificates (Let's Encrypt)
- 🌐 Custom domains
- 📊 Resource monitoring

---

## 📦 Quick Start

### One-Command Install

```bash
curl -fsSL https://get.railover.com | sh
```

### Docker Compose

```bash
docker-compose up -d
```

### Manual Install

```bash
git clone https://github.com/ilyosdev/railover.git
cd railover
sudo ./scripts/install.sh
```

Access at: `http://your-server-ip`

Default login: `admin` / `password` (see install logs)

---

## 📚 Documentation

- [Installation Guide](docs/INSTALL.md)
- [Team Management](docs/TEAM.md)
- [Deployment Guide](docs/DEPLOY.md)
- [API Reference](docs/API.md)

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">
  Made with ❤️ by the open source community
</div>
