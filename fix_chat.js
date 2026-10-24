import fs from 'fs';
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');

if (!code.includes('Folder,')) {
    code = code.replace(/FolderPlus,/, 'FolderPlus, Folder,');
}

code = code.replace(
    /\.then\(\(\) => fetchMessages\(\)\);/g,
    '.then(() => setFiles([])); // Message sent'
);

fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
console.log('Fixed chat');
