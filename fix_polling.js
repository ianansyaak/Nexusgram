import fs from 'fs';

let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');

// The initial fetch is:
// fetch(\`/api/telegram/messages/\${chatId}\`)
// Let's add a setInterval for it to poll every 1 second (fast receive messages)
const searchStr = `
    fetch(\`/api/telegram/messages/\${chatId}\`)
      .then((res) => res.json())
      .then((data) => {
`;

if (code.includes(searchStr)) {
    code = code.replace(searchStr, `
    const fetchMessages = () => {
      fetch(\`/api/telegram/messages/\${chatId}\`)
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setMessages((prev) => {
            if (prev.length === 0) return data;
            // Only update if there's a difference to avoid React re-renders
            if (data[0]?.id !== prev[0]?.id || data.length !== prev.length || JSON.stringify(data.map(m => m.id)) !== JSON.stringify(prev.map(m => m.id))) {
              return data;
            }
            return prev;
          });
          // ... rest of the code will execute on first load, so we shouldn't nest the existing block.
`);
}

// Actually it's easier to find the useEffect and inject a setInterval at the end of it.
