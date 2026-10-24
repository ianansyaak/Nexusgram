import fs from 'fs';

let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf-8');

// Add headers for translate
code = code.replace(
    'fetch("/api/telegram/translate", {',
    `fetch("/api/telegram/translate", {
      headers: {
        "Content-Type": "application/json",
        "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || ""
      },`
);

// Add headers for transcribe
// Wait, the first one is just { method: 'POST' }
code = code.replace(
    /fetch\(\`\/api\/telegram\/transcribe\/\$\{message\.chatId\}\/\$\{message\.id\}\`, \{ method: 'POST' \}\);/g,
    `fetch(\`/api/telegram/transcribe/\${message.chatId}/\${message.id}\`, { method: 'POST', headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" } });`
);

code = code.replace(
    /fetch\(\`\/api\/telegram\/transcribe\/\$\{message\.chatId\}\/\$\{message\.id\}\`, \{/g,
    `fetch(\`/api/telegram/transcribe/\${message.chatId}/\${message.id}\`, {
                            headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" },`
);

fs.writeFileSync('src/components/MessageItem.tsx', code);
