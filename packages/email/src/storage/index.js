// Provide a CommonJS re-export of the TypeScript source for Jest
// which does not transform this `.js` file. Using `require` avoids
// syntax errors when the tests import `./storage/index.js`.
module.exports = require('./index.ts');
