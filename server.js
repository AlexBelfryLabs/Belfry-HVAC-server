var http=require("http");
var https=require("https");
var fs=require("fs");
var path=require("path");
var server=http.createServer(function(req,res){
res.setHeader("Access-Control-Allow-Origin","*");
res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS");
res.setHeader("Access-Control-Allow-Headers","Content-Type");
if(req.method==="OPTIONS"){res.writeHead(200);res.end();return;}
if(req.method==="GET"&&req.url==="/"){
var fp=path.join(__dirname,"toolkit.html");
fs.readFile(fp,"utf8",function(e,d){
if(e){res.writeHead(500);res.end("Error:"+e.message);return;}
res.writeHead(200,{"Content-Type":"text/html"});
res.end(d);});return;}
if(req.method==="POST"&&req.url==="/api/chat"){
var body="";
req.on("data",function(c){body+=c;});
req.on("end",function(){
var prompt=JSON.parse(body).prompt;
var pd=JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]});
var opt={hostname:"api.anthropic.com",path:"/v1/messages",method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","Content-Length":Buffer.byteLength(pd)}};
var ar=https.request(opt,function(r){var d="";r.on("data",function(c){d+=c;});r.on("end",function(){var p=JSON.parse(d);var t=p.content.map(function(i){return i.text||"";}).join("\n");res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({result:t}));});});
ar.on("error",function(e){res.writeHead(500,{"Content-Type":"application/json"});res.end(JSON.stringify({error:e.message}));});
ar.write(pd);ar.end();});return;}
res.writeHead(404);res.end("Not found");});
var PORT=process.env.PORT||3000;
server.listen(PORT,"0.0.0.0",function(){console.log("running");});
