import fs from 'fs';

let chatCode = fs.readFileSync('src/components/ChatWindow.tsx', 'utf-8');
chatCode = chatCode.replace(
    '        headers: {\n          "Content-Type": "application/json",\n        },',
    ''
);
fs.writeFileSync('src/components/ChatWindow.tsx', chatCode);

let msgCode = fs.readFileSync('src/components/MessageItem.tsx', 'utf-8');
msgCode = msgCode.replace(
    '      method: "POST",\n      headers: {\n        "Content-Type": "application/json",\n      },',
    '      method: "POST",'
);

msgCode = msgCode.replace(
    'fetch(`/api/telegram/transcribe/${message.chatId}/${message.id}`, {\n                            headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" },\n                            method: "POST",\n                          });',
    'fetch(`/api/telegram/transcribe/${message.chatId}/${message.id}`, {\n                            headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" },\n                            method: "POST",\n                          });'
); // wait, let me just replace all multiple headers with a regex

msgCode = msgCode.replace(/headers:\s*\{[^}]*\},[\s\n]*headers:\s*\{/g, 'headers: {');

fs.writeFileSync('src/components/MessageItem.tsx', msgCode);
