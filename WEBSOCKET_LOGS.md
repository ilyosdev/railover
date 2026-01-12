# WebSocket Real-time Log Streaming

This document describes the real-time log streaming implementation for Railover using WebSocket.

## Architecture

### Backend Components

1. **LogStreamRouter** (`src/routes/user/apps/logs/LogStreamRouter.ts`)

    - WebSocket server using Socket.IO
    - Handles client connections, subscriptions, and authentication
    - Streams Docker service logs in real-time
    - Parses Docker multiplexed stream format
    - Runs on port 3001 (adminPortNumber3000 + 1)

2. **Integration Points**
    - `src/routes/user/apps/AppsRouter.ts` - Mounts logs router
    - `src/app.ts` - Exports WebSocket initialization function
    - `src/server.ts` - Initializes WebSocket server on startup

### Frontend Components

1. **RealtimeLogs Component** (`railoover-frontend/src/containers/projects/RealtimeLogs.tsx`)

    - React component for displaying real-time logs
    - Connects to WebSocket server
    - Features: pause/resume, clear, download, auto-scroll
    - Color-coded log levels (error, warning, info, debug)
    - Distinguishes stdout/stderr streams

2. **Styling** (`railoover-frontend/src/containers/projects/RealtimeLogs.css`)
    - Terminal-like appearance
    - Dark background with syntax highlighting
    - Scrollable container with custom scrollbar

## Installation

### Backend

```bash
cd /Users/mac/Documents/my-products/railover
npm install
npm run build
```

Dependencies added:

- `socket.io@^4.8.1`
- `@types/socket.io@^3.0.2`

### Frontend

```bash
cd /Users/mac/Documents/my-products/railoover-frontend
npm install
```

Dependencies added:

- `socket.io-client@^4.8.1`
- `@types/socket.io-client@^3.0.0`

## Usage

### Backend API

The WebSocket server automatically starts when Railover starts. It listens on port 3001 by default.

**Connection endpoint**: `ws://your-domain:3001/logs-socket`

**Events**:

- `subscribe` - Subscribe to app logs

    ```typescript
    socket.emit('subscribe', {
        appName: 'my-app',
        token: 'namespace:jwt-token',
    })
    ```

- `log` - Receive log entries

    ```typescript
    socket.on('log', (data) => {
        // data: { appName, line, timestamp, stream }
    })
    ```

- `unsubscribe` - Stop receiving logs
    ```typescript
    socket.emit('unsubscribe', {})
    ```

### Frontend Component

```tsx
import RealtimeLogs from './containers/projects/RealtimeLogs'

function MyComponent() {
    const token = 'namespace:jwt-token'

    return (
        <RealtimeLogs
            appName="my-app"
            token={token}
            socketUrl="ws://localhost:3001" // optional
        />
    )
}
```

**Props**:

- `appName` (required): Name of the app to stream logs from
- `token` (required): Authentication token in format `namespace:jwt-token`
- `socketUrl` (optional): WebSocket server URL, defaults to current host:3001

**Features**:

- Auto-connects on mount
- Auto-reconnects on disconnect
- Pause/Resume streaming
- Clear logs
- Download logs as .txt file
- Auto-scroll (disabled when paused)
- Shows connection status
- Displays last 1000 log lines

## Authentication

The WebSocket server uses JWT authentication. Clients must provide a token in the format:

```
namespace:jwt-token
```

Example:

```
captain:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is verified using the same Authenticator used for HTTP requests.

## Docker Log Format

Docker uses a multiplexed stream format with an 8-byte header:

```
[STREAM_TYPE, 0, 0, 0, SIZE1, SIZE2, SIZE3, SIZE4] [PAYLOAD]
```

- `STREAM_TYPE`: 1 = stdout, 2 = stderr
- `SIZE`: 4-byte big-endian integer representing payload size
- `PAYLOAD`: Log message content

The LogStreamRouter automatically parses this format and emits structured log events.

## Configuration

### Backend

WebSocket port is calculated as:

```typescript
const port = CaptainConstants.configs.adminPortNumber3000 + 1
```

Default: 3001

To change, modify `adminPortNumber3000` in environment variables or config override.

### Frontend

Socket.IO configuration in `RealtimeLogs.tsx`:

```typescript
{
  path: '/logs-socket',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
}
```

## Troubleshooting

### Backend not starting

- Check if port 3001 is available
- Verify socket.io is installed: `npm ls socket.io`
- Check logs for initialization errors

### Frontend can't connect

- Verify WebSocket server is running
- Check browser console for errors
- Ensure token is valid and properly formatted
- Verify CORS settings allow your frontend domain

### No logs appearing

- Check if Docker service exists: `docker service ls | grep your-app`
- Verify user has permission to access the app
- Check backend logs for authentication errors
- Ensure app is actually producing output

### Logs stop streaming

- Check if Docker service crashed
- Verify network connection
- Look for WebSocket disconnect events in console

## Performance

- Logs are limited to last 1000 entries in frontend (configurable via `maxLogs`)
- Docker streams last 100 lines on initial connection (`tail: 100`)
- Auto-scroll can be paused to reduce UI updates
- WebSocket uses binary frames for efficiency

## Security

- JWT authentication required for all connections
- Namespace-based isolation
- Token verification on each subscription
- Automatic cleanup on disconnect
- No log persistence on server (streaming only)

## Future Enhancements

- [ ] Filter logs by log level
- [ ] Search within logs
- [ ] Multiple app log streaming (tabs/split view)
- [ ] Log timestamps from Docker (optional)
- [ ] Configurable tail count
- [ ] Export in different formats (JSON, CSV)
- [ ] Share log view (read-only link)
- [ ] Log alerts/notifications
