import fs from 'fs';

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// Replace standard cache headers with stronger ones
serverCode = serverCode.replace(
    /res\.setHeader\("Cache-Control", "public, max-age=31536000"\);/g,
    'res.setHeader("Cache-Control", "public, max-age=31536000, immutable");'
);

fs.writeFileSync('server.ts', serverCode);
console.log('Fixed cache headers');
