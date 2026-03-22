var http = require(“http”);
var https = require(“https”);
var fs = require(“fs”);
var path = require(“path”);

var server = http.createServer(function(req, res) {
res.setHeader(“Access-Control-Allow-Origin”, “*”);
res.setHeader(“Access-Control-Allow-Methods”, “POST, GET, OPTIONS”);
res.setHeader(“Access-Control-Allow-Headers”, “Content-Type”);

if (req.method === “OPTIONS”) {
res.writeHead(200);
res.end();
return;
}

if (req.method === “GET” && req.url === “/”) {
var filePath = path.join(__dirname, “toolkit.html”);
fs.readFile(filePath, “utf8”, function(err, data) {
if (err) {
res.writeHead(500);
res.end(“Error: “ + err.message);
return;
}
res.writeHead(200, { “Content-Type”: “text/html; charset=utf-8” });
res.end(data);
});
return;
}

if (req.method === “POST” && req.url === “/api/chat”) {
var body = “”;
req.on(“data”, function(chunk) { body += chunk; });
req.on(“end”, function() {
try {
var parsed = JSON.parse(body);
var prompt = parsed.prompt;
var postData = JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
messages: [{ role: “user”, content: prompt }]
});
var options = {
hostname: “api.anthropic.com”,
path: “/v1/messages”,
method: “POST”,
headers: {
“Content-Type”: “application/json”,
“x-api-key”: process.env.ANTHROPIC_API_KEY,
“anthropic-version”: “2023-06-01”,
“Content-Length”: Buffer.byteLength(postData)
}
};
var apiReq = https.request(options, function(apiRes) {
var data = “”;
apiRes.on(“data”, function(chunk) { data += chunk; });
apiRes.on(“end”, function() {
try {
var result = JSON.parse(data);
if (result.error) {
res.writeHead(500, { “Content-Type”: “application/json” });
res.end(JSON.stringify({ error: result.error.message }));
return;
}
var text = result.content.map(function(i) { return i.text || “”; }).join(”\n”);
res.writeHead(200, { “Content-Type”: “application/json” });
res.end(JSON.stringify({ result: text }));
} catch(e) {
res.writeHead(500, { “Content-Type”: “application/json” });
res.end(JSON.stringify({ error: “Parse error” }));
}
});
});
apiReq.on(“error”, function(e) {
res.writeHead(500, { “Content-Type”: “application/json” });
res.end(JSON.stringify({ error: e.message }));
});
apiReq.write(postData);
apiReq.end();
} catch(err) {
res.writeHead(500, { “Content-Type”: “application/json” });
res.end(JSON.stringify({ error: err.message }));
}
});
return;
}

res.writeHead(404);
res.end(“Not found”);
});

var PORT = process.env.PORT || 3000;
server.listen(PORT, “0.0.0.0”, function() {
console.log(“Server running on port “ + PORT);
});
