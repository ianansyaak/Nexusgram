const fs = require('fs');
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf8');

const oldListener = `    // AyuGram Anti-Recall: listen for deleted messages`;
const newListener = `    const handleOptimisticReact = (e: any) => {
      const { messageId, emoticon, remove } = e.detail;
      setMessages(prev => prev.map(msg => {
        if (msg.id.toString() === messageId.toString()) {
          const reactions = msg.reactions ? [...msg.reactions] : [];
          const existing = reactions.find(r => r.emoticon === emoticon);
          if (existing) {
            if (remove) {
              existing.count = Math.max(0, existing.count - 1);
              existing.chosenOrder = null;
            } else {
              existing.count += 1;
              existing.chosenOrder = 0;
            }
          } else if (!remove) {
            reactions.push({ emoticon, count: 1, chosenOrder: 0 });
          }
          return { ...msg, reactions: reactions.filter(r => r.count > 0) };
        }
        return msg;
      }));
    };
    window.addEventListener('optimistic-react', handleOptimisticReact);

    // AyuGram Anti-Recall: listen for deleted messages`;

const cleanupOld = `    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      socket.disconnect();`;
const cleanupNew = `    return () => {
      window.removeEventListener('optimistic-react', handleOptimisticReact);
      document.removeEventListener("visibilitychange", handleVisChange);
      socket.disconnect();`;

code = code.replace(oldListener, newListener);
code = code.replace(cleanupOld, cleanupNew);

fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
