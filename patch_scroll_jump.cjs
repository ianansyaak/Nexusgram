const fs = require('fs');
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf8');

// Find loadMoreMessages
const oldLoadMore = `      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length === 0 || data.length < 5) setHasMore(false);
          setMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.filter((m) => !prevIds.has(m.id));
            const all = [...newMsgs, ...prev];
            return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          });
        }
      })`;

const newLoadMore = `      .then((data) => {
        if (Array.isArray(data)) {
          if (data.length === 0 || data.length < 5) setHasMore(false);
          
          const el = chatAreaRef.current;
          const oldScrollHeight = el ? el.scrollHeight : 0;
          const oldScrollTop = el ? el.scrollTop : 0;

          setMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.filter((m) => !prevIds.has(m.id));
            const all = [...newMsgs, ...prev];
            
            // Adjust scroll position after render using a microtask
            if (newMsgs.length > 0 && el) {
              setTimeout(() => {
                if (chatAreaRef.current) {
                  const newScrollHeight = chatAreaRef.current.scrollHeight;
                  chatAreaRef.current.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                }
              }, 0);
            }
            
            return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          });
        }
      })`;

code = code.replace(oldLoadMore, newLoadMore);
fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
