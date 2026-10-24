import fs from 'fs';

let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');

// Inject a quick polling setInterval at the end of the main useEffect:
// search for: return () => {
//              clearTimeout(markReadTimeout);
//              clearInterval(statusInterval);
//            };
// We can just append a setInterval for polling messages.
const fetchMsgCode = `
    const pollMessages = setInterval(() => {
      fetch(\`/api/telegram/messages/\${chatId}\`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMessages(prev => {
              // basic check to prevent re-renders
              if (prev.length > 0 && data.length > 0 && prev[0].id === data[0].id && prev.length === data.length) {
                return prev;
              }
              return data;
            });
          }
        }).catch(() => {});
    }, 1500);
`;

const replaceTarget = `return () => {
      clearTimeout(markReadTimeout);
      clearInterval(statusInterval);
    };`;

if (code.includes(replaceTarget)) {
    code = code.replace(replaceTarget, fetchMsgCode + `\n    return () => {
      clearTimeout(markReadTimeout);
      clearInterval(statusInterval);
      clearInterval(pollMessages);
    };`);
}

fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
console.log('Fixed polling');
