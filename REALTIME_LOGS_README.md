# 🚀 Real-time Log Streaming for Railover

Railway-style live log streaming implementation using WebSocket.

## 📋 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This implementation adds real-time log streaming to Railover VDS PaaS, similar to Railway's live logs feature. It uses WebSocket (Socket.IO) to stream Docker service logs directly to the browser in real-time.

### Features

✅ Real-time log streaming  
✅ WebSocket-based (Socket.IO 4.8.1)  
✅ JWT authentication  
✅ Pause/Resume streaming  
✅ Download logs  
✅ Auto-scroll (with manual override)  
✅ Color-coded log levels  
✅ Stdout/Stderr separation  
✅ Auto-reconnection  
✅ Multiple client support

## 🚀 Quick Start

### Backend

```bash
cd /Users/mac/Documents/my-products/railover

# Install dependencies
npm install

# Build
npm run build

# Start server (WebSocket starts automatically)
npm start
```

WebSocket server will be available at: **ws://localhost:3001/logs-socket**

### Frontend

```bash
cd /Users/mac/Documents/my-products/railoover-frontend

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start
```

### Test Connection

```bash
cd /Users/mac/Documents/my-products/railover

# Test with sample app
node test-websocket-logs.js my-app captain:your-jwt-token ws://localhost:3001
```

## 🏗️ Architecture

### Backend Stack

```
Express.js (HTTP)
    ↓
Socket.IO Server (WebSocket)
    ↓
Docker Service Logs (Streaming)
    ↓
Clients (Browser/CLI)
```

### Component Diagram

```
┌─────────────────────────────────────────────┐
│              Client (Browser)               │
│  ┌──────────────────────────────────────┐   │
│  │     RealtimeLogs Component           │   │
│  │  - WebSocket Connection              │   │
│  │  - Log Display                       │   │
│  │  - Controls (Pause/Clear/Download)   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↕ WebSocket
┌─────────────────────────────────────────────┐
│         Railover Backend (Node.js)          │
│  ┌──────────────────────────────────────┐   │
│  │     LogStreamRouter                  │   │
│  │  - Socket.IO Server (Port 3001)      │   │
│  │  - JWT Authentication                │   │
│  │  - Stream Parser                     │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    ↕ Docker API
┌─────────────────────────────────────────────┐
│          Docker Service Logs                │
│  - stdout/stderr streams                    │
│  - Multiplexed format                       │
└─────────────────────────────────────────────┘
```

## 📦 Installation

### Dependencies

**Backend:**

```json
{
    "socket.io": "^4.8.1"
}
```

**Frontend:**

```json
{
    "socket.io-client": "^4.8.1"
}
```

### Files Created

**Backend:**

- `src/routes/user/apps/logs/LogStreamRouter.ts` - WebSocket server
- `WEBSOCKET_LOGS.md` - Technical documentation
- `WEBSOCKET_USAGE_EXAMPLE.md` - Usage examples
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `test-websocket-logs.js` - Test client

**Frontend:**

- `railoover-frontend/src/containers/projects/RealtimeLogs.tsx` - React component
- `railoover-frontend/src/containers/projects/RealtimeLogs.css` - Styles

### Files Modified

**Backend:**

- `src/routes/user/apps/AppsRouter.ts` - Added logs router
- `src/app.ts` - Added WebSocket initialization
- `src/server.ts` - Start WebSocket server
- `package.json` - Added dependencies

**Frontend:**

- `package.json` - Added dependencies

## 💻 Usage

### React Component

```tsx
import RealtimeLogs from './containers/projects/RealtimeLogs'

function MyComponent() {
    const appName = 'my-nodejs-app'
    const token = 'captain:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    return <RealtimeLogs appName={appName} token={token} />
}
```

### JavaScript Client

```javascript
const io = require('socket.io-client')

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
})

socket.on('connect', () => {
    socket.emit('subscribe', {
        appName: 'my-app',
        token: 'captain:your-jwt-token',
    })
})

socket.on('log', (data) => {
    console.log(data.line)
})
```

### CLI Test Client

```bash
# Basic usage
node test-websocket-logs.js my-app captain:token

# Custom URL
node test-websocket-logs.js my-app captain:token ws://my-server:3001

# Press Ctrl+C to exit
```

## 🧪 Testing

### 1. Backend Unit Test

```bash
cd /Users/mac/Documents/my-products/railover
npm run build
npm run lint
```

Expected output: No errors

### 2. WebSocket Connection Test

```bash
# Terminal 1: Start Railover
npm start

# Terminal 2: Test connection
node test-websocket-logs.js test-app captain:test-token
```

Expected output:

```
✅ Connected to WebSocket server
📡 Subscribing to logs...
✅ Subscribed: Subscribed to logs
```

### 3. Frontend Integration Test

```bash
cd /Users/mac/Documents/my-products/railoover-frontend
npm start
```

Navigate to component and verify:

- ✅ Connection status shows "Connected"
- ✅ Logs stream in real-time
- ✅ Pause button works
- ✅ Download button works
- ✅ Auto-scroll works

### 4. Multiple Client Test

Open 2+ browser tabs and verify:

- ✅ Each client receives logs independently
- ✅ No cross-contamination
- ✅ Closing one doesn't affect others

### 5. Reconnection Test

1. Start Railover and client
2. Stop Railover
3. Verify client shows "Disconnected"
4. Restart Railover
5. Verify client reconnects automatically

## 📚 Documentation

### Main Documentation

- **[WEBSOCKET_LOGS.md](./WEBSOCKET_LOGS.md)** - Complete technical documentation

    - Architecture details
    - API reference
    - Docker log format
    - Configuration
    - Troubleshooting
    - Security

- **[WEBSOCKET_USAGE_EXAMPLE.md](./WEBSOCKET_USAGE_EXAMPLE.md)** - Usage examples

    - React integration
    - JavaScript client
    - Python client
    - Node.js CLI tool
    - Advanced patterns

- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation details
    - Components created
    - Dependencies added
    - File structure
    - API endpoints
    - Testing checklist

### API Reference

#### WebSocket Events

**Client → Server:**

```typescript
subscribe: { appName: string, token: string }
unsubscribe: {}
```

**Server → Client:**

```typescript
subscribed: { appName: string, message: string }
log: { appName: string, line: string, timestamp: number, stream: 'stdout'|'stderr' }
error: { message: string }
stream-ended: { appName: string }
```

#### HTTP Endpoints

```
GET /api/v2/user/apps/logs/connection-info
```

Response:

```json
{
    "socketPath": "/logs-socket",
    "port": 3001,
    "transports": ["websocket", "polling"]
}
```

## 🔧 Troubleshooting

### Backend Issues

#### Port 3001 already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### WebSocket not starting

Check logs for:

```
WebSocket server listening on port 3001
```

If not present:

1. Verify socket.io is installed: `npm ls socket.io`
2. Check for errors in console
3. Verify `initializeWebSocketServer()` is called in `server.ts`

### Frontend Issues

#### Can't connect to WebSocket

1. Check browser console for errors
2. Verify backend is running on port 3001
3. Test with CLI client: `node test-websocket-logs.js`
4. Check CORS settings

#### Logs not appearing

1. Verify token is valid
2. Check if Docker service exists
3. Verify app is producing output
4. Check backend logs for errors

### Common Errors

**Error: "Not authenticated"**

- Solution: Verify token format is `namespace:jwt-token`
- Check token is valid and not expired

**Error: "Access denied"**

- Solution: Verify user has permission to access app
- Check namespace matches app ownership

**Error: "Failed to stream logs"**

- Solution: Verify Docker service exists
- Check service name format: `srv-captain-{appName}`
- Verify Docker is running

### Debug Mode

Enable Socket.IO debugging:

**Backend:**

```bash
DEBUG=socket.io* npm start
```

**Frontend:**

```javascript
localStorage.debug = 'socket.io-client:*'
```

## 🎓 Examples

### Save logs to file

```javascript
const fs = require('fs')
const io = require('socket.io-client')

const socket = io('ws://localhost:3001', { path: '/logs-socket' })
const stream = fs.createWriteStream('logs.txt')

socket.on('log', (data) => {
    stream.write(`${data.line}\n`)
})
```

### Filter error logs only

```javascript
socket.on('log', (data) => {
    if (data.stream === 'stderr' || data.line.toLowerCase().includes('error')) {
        console.error(data.line)
    }
})
```

### Multiple apps in tabs

```tsx
<Tabs>
    {apps.map((app) => (
        <TabPane tab={app.name} key={app.name}>
            <RealtimeLogs appName={app.name} token={token} />
        </TabPane>
    ))}
</Tabs>
```

## 🚀 Production Deployment

### Nginx Configuration

```nginx
location /logs-socket/ {
  proxy_pass http://localhost:3001/logs-socket/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

### SSL/TLS (WSS)

Use `wss://` protocol in production:

```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const url = `${protocol}//${window.location.host}`
```

### Firewall

Open port 3001 for WebSocket:

```bash
ufw allow 3001/tcp
```

## 📝 License

MIT License - Same as Railover

## 🤝 Contributing

1. Test your changes thoroughly
2. Update documentation
3. Follow existing code style
4. Run linter: `npm run lint`
5. Build successfully: `npm run build`

## 📞 Support

For issues or questions:

1. Check this README
2. Review [WEBSOCKET_LOGS.md](./WEBSOCKET_LOGS.md)
3. Check [WEBSOCKET_USAGE_EXAMPLE.md](./WEBSOCKET_USAGE_EXAMPLE.md)
4. Open GitHub issue

---

**Made with ❤️ for Railover VDS PaaS**
