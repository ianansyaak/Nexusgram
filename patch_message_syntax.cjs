const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

code = code.replace(/<\/div>\s*\)\}\s*<\/>/, '</>');
fs.writeFileSync('src/components/MessageItem.tsx', code);
