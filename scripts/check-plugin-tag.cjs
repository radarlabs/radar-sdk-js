const fs = require('fs');
const path = require('path');

const ALLOWED_PLUGINS = ['maps', 'autocomplete'];

const pluginName = process.argv[2];
const version = process.argv[3];
const releaseType = process.argv[4]; // "stable" or "beta"

if (!pluginName || !version || !releaseType) {
  console.error('Usage: check-plugin-tag.cjs <plugin-name> <version> <stable|beta>');
  process.exit(1);
}

if (!ALLOWED_PLUGINS.includes(pluginName)) {
  console.error(`Unknown plugin: ${pluginName}. Allowed: ${ALLOWED_PLUGINS.join(', ')}`);
  process.exit(1);
}

if (!['stable', 'beta'].includes(releaseType)) {
  console.error(`Release type must be "stable" or "beta", got: ${releaseType}`);
  process.exit(1);
}

const pkgPath = path.resolve(__dirname, '..', 'packages', pluginName, 'package.json');
if (!fs.existsSync(pkgPath)) {
  console.error(`Package not found: ${pkgPath}`);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.version !== version) {
  console.error(
    `VERSION MISMATCH - tag version "${version}" does not match packages/${pluginName}/package.json version "${pkg.version}"`,
  );
  process.exit(1);
}

const fileVersion = fs
  .readFileSync(path.resolve(__dirname, '..', 'packages', pluginName, 'src', 'version.ts'), 'utf8')
  .replace('export default', '')
  .replaceAll("'", '')
  .replace(';', '')
  .trim();

if (fileVersion !== version) {
  console.error(
    `VERSION MISMATCH - tag version "${version}" does not match packages/${pluginName}/src/version.ts version "${fileVersion}"`,
  );
  process.exit(1);
}

if (releaseType === 'stable' && version.includes('-')) {
  console.error(`Stable release should not include a prerelease suffix: ${version}`);
  process.exit(1);
}

if (releaseType === 'beta' && !version.includes('-beta')) {
  console.error(`Beta release must include a "-beta" suffix: ${version}`);
  process.exit(1);
}

console.log(`Plugin tag OK. ${pluginName}@${version} (${releaseType})`);
