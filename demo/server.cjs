const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
const liveServer = require('live-server');

fs.watch(path.join(__dirname, '../src'), { recursive: true }, (event, filename) => {
  console.log(event, 'detected', filename, '..rebuilding');
  exec('npm run build', (err) => {
    if (err) {
      console.error(err);
    }
  });
});

// connect middleware to re-write script tags from the example repo that use
// the global CDN (radar.js.com) to use the local development versions instead.
const rewriteScript = (req, res, next) => {
  let body = [];
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function(chunk) {
    body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  };

  // re-write response to swap out script tag
  res.end = function(chunk, encoding) {
    if (chunk) {
      body.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    let responseBody = Buffer.concat(body).toString();

    // replace global CDN scripts with local version for easier development
    const lines = responseBody.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/"https:\/\/js\.radar\.com(.*?)"/);
      if (match) {
        const script = match[0];
        if (script.includes('.css')) {
          lines[i] = line.replace(script, '"/cdn/radar.css"');
        } else {
          lines[i] = line.replace(script, '"/cdn/radar.js"');
        }
      }
    }
    responseBody = lines.join('\n');

    const modifiedBuffer = Buffer.from(responseBody, encoding);
    res.setHeader('Content-Length', Buffer.byteLength(modifiedBuffer));
    res.setHeader('Cache-Control', 'no-cache');
    res.write = originalWrite;
    res.end = originalEnd;
    res.end(modifiedBuffer, encoding);
  };

  next();
};

const params = {
	port: 9001,
	host: "0.0.0.0",
	root: "./demo", // Set root directory that's being served. Defaults to cwd.
	mount: [['/cdn', path.join(__dirname, '../cdn')]], // serve /cdn files under the development "/cdn" path
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
  middleware: [rewriteScript],
};

// live-reloading server
liveServer.start(params);
