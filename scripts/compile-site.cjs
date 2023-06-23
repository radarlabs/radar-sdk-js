const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

const sdk_version = require('../package.json').version;

// create output dir if does not exist
const outputDir = './site';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// copy static assets
fs.cpSync('./demo/static', './site/static', { recursive: true });

const templateDir = './demo/views';
const layout = handlebars.compile(fs.readFileSync(path.join(templateDir, 'layouts/main.hbs')).toString());

const js_file = `https://js.radar.com/v${sdk_version}/radar.min.js`;
const css_file = `https://js.radar.com/v${sdk_version}/radar.css`;

const pages = fs.readdirSync(templateDir).filter((file) => !file.includes('layouts'));
pages.forEach((page) => {
  const name = path.basename(page).split('.hbs')[0];
  const title = name.replace(/-/g, ' ');

  const contents = fs.readFileSync(path.join(templateDir, page)).toString();
  const template = handlebars.compile(contents);
  const body = template({ sdk_version });
  const html = layout({ name, title, sdk_version, js_file, css_file, body });

  fs.writeFileSync(path.join(outputDir, `${name}.html`), html);

  // write index page
  if (name === 'display-a-map') {
    fs.writeFileSync(path.join(outputDir, 'index.html'), html);
  }
});
console.log('Done.');
