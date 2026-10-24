const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

const oldReplies = `{message.replies && typeof message.replies.replies === 'number' && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const event = new CustomEvent('open-comments', { detail: { messageId: message.id, channelId: message.chatId } });
              window.dispatchEvent(event);
            }}
            className="mt-2 w-full py-2 bg-[#1e1e2c] hover:bg-[#252538] border border-indigo-500/15 text-indigo-300 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            💬 {isChannel ? "Комментарии" : "Ответы"} ({message.replies.replies})
          </button>
        )}`;

const newReplies = `{(message.repliesCount > 0 || (message.replies && typeof message.replies.replies === 'number')) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const event = new CustomEvent('open-comments', { detail: { messageId: message.id, channelId: message.chatId } });
              window.dispatchEvent(event);
            }}
            className="mt-2 w-full py-1.5 bg-[#1e1e2c] hover:bg-[#252538] border border-indigo-500/15 text-indigo-300 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            💬 {isChannel ? "Комментарии" : "Ответы"} ({message.repliesCount || message.replies?.replies})
          </button>
        )}`;

code = code.replace(oldReplies, newReplies);
fs.writeFileSync('src/components/MessageItem.tsx', code);
