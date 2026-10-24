import fs from 'fs';

// Fix TelegramChatWindow.tsx
let chatCode = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');
if (!chatCode.includes('import { Folder,')) {
    chatCode = chatCode.replace(/import {/, 'import { Folder,');
    fs.writeFileSync('src/components/TelegramChatWindow.tsx', chatCode);
}

// Fix server.ts Document media download issue
let serverCode = fs.readFileSync('server.ts', 'utf-8');
const badDownloadLine = 'const buffer = await client.downloadMedia(doc, { workers: 16 });';
if (serverCode.includes(badDownloadLine)) {
    serverCode = serverCode.replace(
        badDownloadLine,
        'const buffer = await client.downloadMedia({ document: doc } as any, { workers: 16 });'
    );
    fs.writeFileSync('server.ts', serverCode);
}

console.log('Fixed lint issues');
