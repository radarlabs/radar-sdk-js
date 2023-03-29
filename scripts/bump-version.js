const fs = require('fs');
const package = require('../package.json');
const lockfile = require('../package-lock.json');
const srcfile = fs.readFileSync('./src/version.js').toString();

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

// update src/version.js
fs.writeFileSync('./src/version.js', srcfile.replace(current, version));

// update package.json
package.version = version;
fs.writeFileSync('./package.json', JSON.stringify(package, null, 2) + '\n');

// update package-lock.json
lockfile.version = version;
fs.writeFileSync('./package-lock.json', JSON.stringify(lockfile, null, 2) + '\n');

console.log('Updated to', version);
