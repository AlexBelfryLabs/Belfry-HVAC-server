const express = require(‘express’);
const cors = require(‘cors’);
const path = require(‘path’);

const app = express();
app.use(cors());
app.use(express.json());

// Serve the toolkit HTML at /
app.get(’/’, (req, res) => {
res.sendFile(path.join(__dirname, ‘toolkit.html’));
});

// Proxy endpoint for AI calls
app.post(’/api/chat’, async (req, res) => {
const { prompt } = req.body;
if (!prompt) {
return res.status(400).json({ error: ‘No prompt provided’ });
}
try {
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: process.env.ANTHROPIC_API_KEY,
‘anthropic-version’: ‘2023-06-01’
},
body: JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 1000,
messages: [{ role: ‘user’, content: prompt }]
})
});
const data = await response.json();
if (data.error) {
return res.status(500).json({ error: data.error.message });
}
const text = data.content.map(i => i.text || ‘’).join(’\n’);
res.json({ result: text });
} catch (err) {
console.error(‘API error:’, err);
res.status(500).json({ error: ‘Server error. Check your API key.’ });
}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ‘0.0.0.0’, () => {
console.log(’Server running on port ’ + PORT);
});
