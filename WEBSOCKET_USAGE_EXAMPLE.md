# WebSocket Log Streaming - Usage Examples

## Quick Start

### 1. Start Railover with WebSocket Support

The WebSocket server starts automatically with Railover:

```bash
cd /Users/mac/Documents/my-products/railover
npm run build
npm start
```

WebSocket server will be available at: `ws://localhost:3001/logs-socket`

### 2. Integrate RealtimeLogs Component

#### Basic Usage

```tsx
import React, { useEffect, useState } from 'react'
import RealtimeLogs from './containers/projects/RealtimeLogs'
import { getAuthToken } from './utils/auth'

function AppLogsPage() {
    const [token, setToken] = useState<string>('')
    const appName = 'my-nodejs-app'

    useEffect(() => {
        const authToken = getAuthToken()
        setToken(authToken)
    }, [])

    return (
        <div>
            <h1>Application Logs</h1>
            <RealtimeLogs appName={appName} token={token} />
        </div>
    )
}

export default AppLogsPage
```

#### With Custom WebSocket URL

```tsx
<RealtimeLogs
    appName="my-app"
    token={token}
    socketUrl="wss://my-railover-domain.com:3001"
/>
```

#### Multiple Apps in Tabs

```tsx
import { Tabs } from 'antd'
import RealtimeLogs from './containers/projects/RealtimeLogs'

function MultiAppLogs() {
    const [token, setToken] = useState<string>('')
    const apps = ['frontend', 'backend', 'worker']

    useEffect(() => {
        setToken(getAuthToken())
    }, [])

    return (
        <Tabs>
            {apps.map((appName) => (
                <Tabs.TabPane tab={appName} key={appName}>
                    <RealtimeLogs appName={appName} token={token} />
                </Tabs.TabPane>
            ))}
        </Tabs>
    )
}
```

## Backend API Examples

### Direct WebSocket Connection (JavaScript/TypeScript)

```typescript
import io from 'socket.io-client'

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
    transports: ['websocket'],
})

socket.on('connect', () => {
    console.log('Connected to WebSocket server')

    socket.emit('subscribe', {
        appName: 'my-app',
        token: 'captain:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
})

socket.on('subscribed', (data) => {
    console.log('Subscribed:', data)
})

socket.on('log', (data) => {
    console.log(`[${new Date(data.timestamp).toISOString()}] ${data.line}`)
})

socket.on('error', (data) => {
    console.error('Error:', data.message)
})

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server')
})
```

### Python Client Example

```python
import socketio

sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('Connected to WebSocket server')
    sio.emit('subscribe', {
        'appName': 'my-app',
        'token': 'captain:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })

@sio.on('subscribed')
def on_subscribed(data):
    print('Subscribed:', data)

@sio.on('log')
def on_log(data):
    print(f"[{data['timestamp']}] {data['line']}")

@sio.on('error')
def on_error(data):
    print('Error:', data['message'])

@sio.on('disconnect')
def on_disconnect():
    print('Disconnected from WebSocket server')

sio.connect('ws://localhost:3001', socketio_path='/logs-socket')
sio.wait()
```

### Node.js CLI Tool

```javascript
#!/usr/bin/env node

const io = require('socket.io-client')
const chalk = require('chalk')

const appName = process.argv[2]
const token = process.argv[3]

if (!appName || !token) {
    console.error('Usage: node tail-logs.js <app-name> <namespace:token>')
    process.exit(1)
}

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
    transports: ['websocket'],
})

socket.on('connect', () => {
    console.log(chalk.green('✓ Connected to log stream'))
    socket.emit('subscribe', { appName, token })
})

socket.on('subscribed', () => {
    console.log(chalk.blue(`📡 Streaming logs for: ${appName}\n`))
})

socket.on('log', (data) => {
    const timestamp = new Date(data.timestamp).toLocaleTimeString()
    const prefix = chalk.gray(`[${timestamp}]`)

    if (data.stream === 'stderr' || data.line.toLowerCase().includes('error')) {
        console.log(prefix, chalk.red(data.line))
    } else if (data.line.toLowerCase().includes('warn')) {
        console.log(prefix, chalk.yellow(data.line))
    } else {
        console.log(prefix, data.line)
    }
})

socket.on('error', (data) => {
    console.error(chalk.red('✗ Error:'), data.message)
    process.exit(1)
})

socket.on('disconnect', () => {
    console.log(chalk.yellow('⚠ Disconnected from log stream'))
})

process.on('SIGINT', () => {
    console.log(chalk.blue('\n👋 Closing connection...'))
    socket.emit('unsubscribe', {})
    socket.disconnect()
    process.exit(0)
})
```

## Getting Authentication Token

### From Browser Console

```javascript
const token = localStorage.getItem('token')
console.log(`captain:${token}`)
```

### From API Request

```typescript
import axios from 'axios'

async function getAuthToken(username: string, password: string) {
    const response = await axios.post('http://localhost:3000/api/v2/login', {
        username,
        password,
    })

    const token = response.data.token
    const namespace = 'captain'

    return `${namespace}:${token}`
}
```

## Advanced Features

### Save Logs to File

```typescript
import fs from 'fs'
import io from 'socket.io-client'

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
})

const logFile = fs.createWriteStream(`logs-${Date.now()}.txt`)

socket.on('log', (data) => {
    const line = `[${new Date(data.timestamp).toISOString()}] ${data.line}\n`
    logFile.write(line)
    process.stdout.write(line)
})

process.on('SIGINT', () => {
    logFile.end()
    socket.disconnect()
    process.exit(0)
})
```

### Filter Logs by Level

```typescript
socket.on('log', (data) => {
    const line = data.line.toLowerCase()

    if (line.includes('error') || data.stream === 'stderr') {
        console.error('ERROR:', data.line)
    } else if (line.includes('warn')) {
        console.warn('WARNING:', data.line)
    } else if (process.env.DEBUG && line.includes('debug')) {
        console.log('DEBUG:', data.line)
    } else if (!line.includes('debug')) {
        console.log(data.line)
    }
})
```

### Reconnection with Backoff

```typescript
let reconnectAttempts = 0
const maxReconnectAttempts = 10

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
    reconnection: true,
    reconnectionAttempts: maxReconnectAttempts,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
})

socket.on('reconnect_attempt', (attempt) => {
    reconnectAttempts = attempt
    console.log(`Reconnection attempt ${attempt}/${maxReconnectAttempts}`)
})

socket.on('reconnect', () => {
    reconnectAttempts = 0
    console.log('Reconnected successfully')

    socket.emit('subscribe', { appName, token })
})

socket.on('reconnect_failed', () => {
    console.error('Failed to reconnect after maximum attempts')
    process.exit(1)
})
```

## Troubleshooting

### Check WebSocket Server Status

```bash
curl http://localhost:3000/api/v2/user/apps/logs/connection-info

{
  "socketPath": "/logs-socket",
  "port": 3001,
  "transports": ["websocket", "polling"]
}
```

### Test Connection

```bash
npm install -g wscat
wscat -c ws://localhost:3001/logs-socket
```

### Debug Mode

```typescript
import io from 'socket.io-client'

const socket = io('ws://localhost:3001', {
    path: '/logs-socket',
    transports: ['websocket'],
})

socket.io.on('error', (error) => {
    console.error('Connection error:', error)
})

socket.io.on('reconnect_error', (error) => {
    console.error('Reconnection error:', error)
})

socket.on('connect_error', (error) => {
    console.error('Connect error:', error.message)
})
```

## Environment-Specific Configuration

### Development

```typescript
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'ws://localhost:3001'

<RealtimeLogs
    appName={appName}
    token={token}
    socketUrl={SOCKET_URL}
/>
```

### Production

```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
const host = window.location.hostname
const port = 3001

const SOCKET_URL = `${protocol}//${host}:${port}`

<RealtimeLogs
    appName={appName}
    token={token}
    socketUrl={SOCKET_URL}
/>
```

### Behind Nginx Proxy

```nginx
location /logs-socket/ {
    proxy_pass http://localhost:3001/logs-socket/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Then connect with:

```typescript
const SOCKET_URL = `${window.location.protocol}//${window.location.host}`

<RealtimeLogs
    appName={appName}
    token={token}
    socketUrl={SOCKET_URL}
/>
```
