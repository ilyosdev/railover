const http = require('http')

const html = `<!DOCTYPE html>
<html>
<head>
    <title>Railover - App Placeholder</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #fff;
        }
        .container {
            text-align: center;
            padding: 40px;
        }
        h1 { 
            font-size: 2.5rem; 
            margin-bottom: 1rem;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        p { color: #a0aec0; font-size: 1.1rem; }
        .status { 
            margin-top: 2rem; 
            padding: 1rem 2rem; 
            background: rgba(102, 126, 234, 0.1); 
            border-radius: 8px;
            border: 1px solid rgba(102, 126, 234, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Railover</h1>
        <p>Your app is being deployed...</p>
        <div class="status">
            <p>This placeholder will be replaced once your build completes.</p>
        </div>
    </div>
</body>
</html>`

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(html)
})

server.listen(80, '0.0.0.0', () => {
    console.log('Railover placeholder running on port 80')
})
