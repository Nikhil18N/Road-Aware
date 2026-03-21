import http from "http";

http.createServer((req, res) => {
res.writeHead(200, { "Content-Type": "text/html" });
res.write(`
    <html>
    <body>
    <h1>Node.js HTML Response</h1>
    <p>This is served from Node.js</p>
    </body>
    </html>
`);
res.end();
}).listen(3000);