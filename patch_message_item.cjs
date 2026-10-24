const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

const regex = /\{translatedText === null && message\.text && \([\s\S]*?<\/div>\s*\)\}/;
code = code.replace(regex, '');

fs.writeFileSync('src/components/MessageItem.tsx', code);
