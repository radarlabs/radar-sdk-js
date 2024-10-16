const path = require('path')

module.exports = {
  '*.md': [
    (filenames) => {
      if (filenames.length === 0) {
        return [];
      }

      const fileNames = filenames.join(' ');
      console.log('Spell-checking files:', filenames);
      return [`cspell ${fileNames} -c cspell.json`];
    },
  ],
}
