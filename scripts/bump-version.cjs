const fs = require('fs');
const package = require('../package.json');
const lockfile = require('../package-lock.json');
const srcfile = fs.readFileSync('./src/version.ts').toString();

const current = package.version;
let version = process.argv[2];


// if version not provided, just bump the smallest increment
if (!version) {
  const parts = current.split('.');
  const minor = Number.parseInt(parts[parts.length - 1]);
  if (Number.isNaN(minor)) {
    throw new Error(`Unreadable minor version in ${current}`);
  }
  parts[parts.length - 1] = minor + 1; // bump version
  version = parts.join('.');
  console.log('No version provided, incrementing minor version to:', version);
}

// strip leading "v" in package version
if (version.startsWith('v')) {
  version = version.slice(1);
}

// update src/version.ts
fs.writeFileSync('./src/version.ts', srcfile.replace(current, version));

// update package.json
package.version = version;
fs.writeFileSync('./package.json', JSON.stringify(package, null, 2) + '\n');

// update package-lock.json
lockfile.version = version;
fs.writeFileSync('./package-lock.json', JSON.stringify(lockfile, null, 2) + '\n');

// update versions in readme
const reg = new RegExp(`js.radar.com\/v([^/]+)\/`, 'g');
const readme = fs.readFileSync('./README.md').toString();
fs.writeFileSync('./README.md', readme.replace(reg, `js.radar.com/v${version}/`));

console.log('Updated to', version);
