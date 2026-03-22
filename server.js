const http = require(‘http’);
const https = require(‘https’);
const fs = require(‘fs’);
const path = require(‘path’);

const server = http.createServer((req, res) => {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Access-Control-Allow-Methods’, ‘POST, GET, OPTIONS’);
res.setHeader(‘Access-Control-Allow-Headers’, ‘Content-Type’);

if (req.method === ‘OPTIONS’) {
res.writeHead(200);
res.end();
return;
}

if (req.method === ‘GET’ && req.url === ‘/’) {
const filePath = path.join(__dirname, ‘toolkit.html’);
fs.readFile(filePath, ‘utf8’, (err, data) => {
if (err) {
res.writeHead(500);
res.end(’Error: ’ + err.message);
return;
}
res.writeHead(200, { ‘Content-Type’: ‘text/html; charset=utf-8’ });
res.end(data);
});
return;
}

if (req.method === ‘POST’ && req.url === ‘/api/chat’) {
let body = ‘’;
req.on(‘data’, chunk => body += chunk);
req.on(‘end’, () => {
try {
const { prompt } = JSON.parse(body);
const postData = JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1000,
messages: [{ role: ‘user’, content: prompt }]
});
const options = {
hostname: ‘api.anthropic.com’,
path: ‘/v1/messages’,
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: process.env.ANTHROPIC_API_KEY,
‘anthropic-version’: ‘2023-06-01’,
‘Content-Length’: Buffer.byteLength(postData)
}
};
const apiReq = https.request(options, (apiRes) => {
let data = ‘’;
apiRes.on(‘data’, chunk => data += chunk);
apiRes.on(‘end’, () => {
try {
const parsed = JSON.parse(data);
if (parsed.error) {
res.writeHead(500, { ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify({ error: parsed.error.message }));
return;
}
const text = parsed.content.map(i => i.text || ‘’).join(’\n’);
res.writeHead(200, { ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify({ result: text }));
} catch(e) {
res.writeHead(500, { ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify({ error: ’Parse error: ’ + e.message }));
}
});
});
apiReq.on(‘error’, (e) => {
res.writeHead(500, { ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify({ error: e.message }));
});
apiReq.write(postData);
apiReq.end();
} catch (err) {
res.writeHead(500, { ‘Content-Type’: ‘application/json’ });
res.end(JSON.stringify({ error: err.message }));
}
});
return;
}

res.writeHead(404);
res.end(‘Not found’);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, ‘0.0.0.0’, () => {
console.log(’Server running on port ’ + PORT);
});
