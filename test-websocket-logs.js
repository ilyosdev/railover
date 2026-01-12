#!/usr/bin/env node

const io = require('socket.io-client')

const appName = process.argv[2] || 'test-app'
const token = process.argv[3] || 'captain:test-token'
const url = process.argv[4] || 'ws://localhost:3001'

console.log('='.repeat(60))
console.log('WebSocket Log Stream Test Client')
console.log('='.repeat(60))
console.log(`App Name: ${appName}`)
console.log(`Token: ${token.substring(0, 20)}...`)
console.log(`URL: ${url}`)
console.log('='.repeat(60))

const socket = io(url, {
    path: '/logs-socket',
    transports: ['websocket', 'polling'],
})

let logCount = 0

socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server')
    console.log('📡 Subscribing to logs...\n')
    socket.emit('subscribe', { appName, token })
})

socket.on('subscribed', (data) => {
    console.log('✅ Subscribed:', data.message)
    console.log(`📋 Streaming logs for: ${data.appName}`)
    console.log('─'.repeat(60))
})

socket.on('log', (data) => {
    logCount++
    const timestamp = new Date(data.timestamp).toLocaleTimeString()
    const stream = data.stream === 'stderr' ? '[STDERR]' : '[STDOUT]'

    let color = '\x1b[0m'
    if (data.stream === 'stderr') {
        color = '\x1b[31m'
    } else if (data.line.toLowerCase().includes('error')) {
        color = '\x1b[31m'
    } else if (data.line.toLowerCase().includes('warn')) {
        color = '\x1b[33m'
    } else if (data.line.toLowerCase().includes('debug')) {
        color = '\x1b[90m'
    }

    console.log(`${color}[${timestamp}] ${stream} ${data.line}\x1b[0m`)
})

socket.on('error', (data) => {
    console.error('❌ Error:', data.message)
    process.exit(1)
})

socket.on('disconnect', () => {
    console.log('\n─'.repeat(60))
    console.log('⚠️  Disconnected from WebSocket server')
    console.log(`📊 Total logs received: ${logCount}`)
})

socket.on('stream-ended', (data) => {
    console.log('\n─'.repeat(60))
    console.log('✅ Stream ended for:', data.appName)
    console.log(`📊 Total logs received: ${logCount}`)
})

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message)
    console.log('\n💡 Tips:')
    console.log('  1. Make sure Railover backend is running')
    console.log('  2. Verify WebSocket server is on port 3001')
    console.log('  3. Check firewall settings')
    process.exit(1)
})

process.on('SIGINT', () => {
    console.log('\n\n─'.repeat(60))
    console.log('👋 Closing connection...')
    console.log(`📊 Total logs received: ${logCount}`)
    socket.emit('unsubscribe', {})
    socket.disconnect()
    process.exit(0)
})

console.log('\n💡 Press Ctrl+C to exit\n')
