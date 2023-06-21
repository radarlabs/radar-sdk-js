const fs = require('fs');
const http = require('http');
const path = require('path');
const opn = require('opn');

const PORT = 8081;

http.createServer(function(req, res){

  const route = req.url.split('?')[0];

  switch (route) {
    case '/dist/radar.js': {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.readFile(path.join(__dirname, '..', 'dist', 'radar.js'), function(err, data) {
        res.end(data);
      });
      break;
    }

    case '/dist/radar.min.js': {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      fs.readFile(path.join(__dirname, '..', 'dist', 'radar.min.js'), function(err, data) {
        res.end(data);
      });
      break;
    }

    case '/': {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      const params = req.url.split('?')[1] || '';

      fs.readFile(path.join(__dirname, 'test.html'), function(err, data){
        let html = data.toString();

        if (params.includes('min')) { // use minified lib
          html = html.replace('/dist/radar.js', '/dist/radar.min.js');
          html = html.replace('min-link', 'min-link active');
        } else {
          html = html.replace('std-link', 'std-link active');
        }

        res.end(html);
      });
      break;
    }

    default: {
      res.writeHead(404);
      res.end();
    }
  }
}).listen(PORT);

setTimeout(() => {
  console.log(`Server is running on Port: ${PORT}`);

  opn(`http://localhost:${PORT}`)
    .catch(() => {});
});
