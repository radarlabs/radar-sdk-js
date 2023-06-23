const fs = require('fs');
const path = require('path');
const { spawn, exec } = require("child_process");
const express = require('express');
const { engine }  = require('express-handlebars');

const sdk_version = require('../package.json').version;

const app = express();
const PORT = 9001;

// rebuild packages if any source files change
fs.watch(path.join(__dirname, '../src'), { recursive: true }, (event, filename) => {
  console.log(event, 'detected in', filename, '..rebuilding');
  const build = spawn('npm', ['run', 'build']);
  build.stdout.on('data', (data) => console.log(data.toString()));
  build.stderr.on('data', (data) => console.error(data.toString()));
  build.on('exit', () => console.log('Done.'));
});

// setup handlebars engine
app.engine('.hbs', engine({ extname: '.hbs', defaultLayout: 'main' }));
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// dont cache anything
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache');
  next();
});

// serve static files
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/cdn', express.static('./cdn'));

// create a route for each handelbars view
const views = fs.readdirSync(path.join(__dirname, 'views'));
views.forEach((view) => {
  const name = path.basename(view).split('.hbs')[0];
  const title = name.replace(/-/g, ' ');

  app.get(`/${name}`, (req, res) => {
    res.render(name, {
      name,
      title,
      sdk_version,
      js_file: '/cdn/radar.js',
      css_file: '/cdn/radar.css',
    });
  });
});

// default to "create-a-map"
app.get('/', (req, res) => {
  res.redirect('/display-a-map');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);

  const url = `http://localhost:${PORT}`;

  switch (process.platform) {
      // Windows
    case 'win32':
      exec(`start ${url}`);
      break;
      // macOS
    case 'darwin':
      exec(`open ${url}`);
      break;
      // Linux
    case 'linux':
      exec(`xdg-open ${url}`);
      break;
    default:
      break;
  }
});
