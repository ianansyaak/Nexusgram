const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace msg.peerId?.userId?.toString() ... block with better chatId parsing
const replacement = `let eventChatId = msg.peerId?.userId?.toString() || msg.peerId?.channelId?.toString() || msg.peerId?.chatId?.toString();
      if (msg.peerId?.className === "PeerChannel") {
        eventChatId = "-100" + msg.peerId.channelId?.toString();
      } else if (msg.peerId?.className === "PeerChat") {
        eventChatId = "-" + msg.peerId.chatId?.toString();
      }
      
      io.emit("new_message", {
        id: msg.id,
        chatId: eventChatId,`;

code = code.replace(
  `io.emit("new_message", {
        id: msg.id,
        chatId:
          msg.peerId?.userId?.toString() ||
          msg.peerId?.channelId?.toString() ||
          msg.peerId?.chatId?.toString(),`,
  replacement
);

fs.writeFileSync('server.ts', code);
