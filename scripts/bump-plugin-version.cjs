const fs = require('fs');
const path = require('path');

const ALLOWED_PLUGINS = ['maps', 'autocomplete'];

const pluginName = process.argv[2];
let version = process.argv[3];

if (!pluginName) {
  console.error('Usage: bump-plugin-version.cjs <plugin-name> [version]');
  process.exit(1);
}

if (!ALLOWED_PLUGINS.includes(pluginName)) {
  console.error(`Unknown plugin: ${pluginName}. Allowed: ${ALLOWED_PLUGINS.join(', ')}`);
  process.exit(1);
}

const pkgPath = path.resolve(__dirname, '..', 'packages', pluginName, 'package.json');
const lockPath = path.resolve(__dirname, '..', 'package-lock.json');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.version;

if (!version) {
  const parts = current.split('.');
  const minor = Number.parseInt(parts[parts.length - 1]);
  if (Number.isNaN(minor)) {
    throw new Error(`Unreadable minor version in ${current}`);
  }
  parts[parts.length - 1] = minor + 1;
  version = parts.join('.');
  console.log('No version provided, incrementing minor version to:', version);
}

if (version.startsWith('v')) {
  version = version.slice(1);
}

pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const versionPath = path.resolve(__dirname, '..', 'packages', pluginName, 'src', 'version.ts');
fs.writeFileSync(versionPath, `export default '${version}';\n`);
console.log(`Updated packages/${pluginName}/src/version.ts`);

const lockfile = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
const workspaceKey = `packages/${pluginName}`;
if (lockfile.packages && lockfile.packages[workspaceKey]) {
  lockfile.packages[workspaceKey].version = version;
  fs.writeFileSync(lockPath, JSON.stringify(lockfile, null, 2) + '\n');
  console.log(`Updated ${workspaceKey} in package-lock.json`);
}

console.log(`${pluginName}: ${current} → ${version}`);
