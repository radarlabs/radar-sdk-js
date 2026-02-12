module.exports = {
  '*.{ts,tsx,js,jsx,cjs,mjs,css,json}': (filenames) => [`oxfmt --write ${filenames.join(' ')}`, 'npm run lint'],
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
};
