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

const params = {
	port: 9001,
	host: "0.0.0.0",
	root: "./demo", // Set root directory that's being served. Defaults to cwd.
	mount: [['/dist', path.join(__dirname, '../dist')]], // server dist files under "/dist" path
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
};

// live-reloading server
liveServer.start(params);
