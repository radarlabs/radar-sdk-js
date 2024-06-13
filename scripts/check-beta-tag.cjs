const fs = require('fs');
const packageJSON = require('../package.json');
const packageLockJSON = require('../package-lock.json');

let tagVersion = process.env.GITHUB_REF_NAME || '';
console.log('Checking tag:', tagVersion);

if (!tagVersion.startsWith('v')) {
  console.error('Tag must start with "v"');
  process.exit(1);
}
if (!tagVersion.includes('-beta') && !tagVersion.includes('-core')) {
  console.error('Prelease version should contiain a "-beta" or "-core" suffix');
  process.exit(1);
}
tagVersion = tagVersion.slice(1); // remove "v"

const fileVersion = fs.readFileSync('./src/version.ts')
  .toString()
  .replace('export default', '')
  .replaceAll('\'', '')
  .replace(';', '')
  .trim();

if (tagVersion !== fileVersion) {
  console.error('VERSION MISMATCH - version does not match ./src/version.ts');
  process.exit(1);
}
if (tagVersion !== packageJSON.version) {
  console.error('VERSION MISMATCH - version does not match package.json.');
  process.exit(1);
}
if (tagVersion !== packageLockJSON.version) {
  console.error('VERSION MISMATCH - version does not match package-lock.json.');
  process.exit(1);
}
console.log('Tag OK.', tagVersion);
