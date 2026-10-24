import fs from 'fs';

let chatCode = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');
if (chatCode.includes('import { Folder,')) {
    chatCode = chatCode.replace('import { Folder,', 'import { ');
    chatCode = chatCode.replace('import { Send,', 'import { Folder, Send,');
    fs.writeFileSync('src/components/TelegramChatWindow.tsx', chatCode);
}

let serverCode = fs.readFileSync('server.ts', 'utf-8');
const badDownloadLine = 'const buffer = await client.downloadMedia({ document: doc } as any, { workers: 16 });';
if (serverCode.includes(badDownloadLine)) {
    serverCode = serverCode.replace(
        badDownloadLine,
        'const buffer = await client.downloadMedia({ document: doc } as any, { workers: 16 } as any);'
    );
    fs.writeFileSync('server.ts', serverCode);
}

console.log('Fixed lint issues 2');
