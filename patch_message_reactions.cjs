const fs = require('fs');
let code = fs.readFileSync('src/components/MessageItem.tsx', 'utf8');

// The problematic block in handleReact:
/*
    // Optimistic UI update
    if (!message.reactions) message.reactions = [];
    const existing = message.reactions.find(r => r.emoticon === emoticon);
    let remove = false;
    
    if (existing) {
      if (existing.chosenOrder !== undefined && existing.chosenOrder !== null) {
        existing.count = Math.max(0, existing.count - 1);
        existing.chosenOrder = null;
        remove = true;
      } else {
        existing.count += 1;
        existing.chosenOrder = 0;
      }
    } else {
      message.reactions.push({ emoticon, count: 1, chosenOrder: 0 });
    }
    message.reactions = message.reactions.filter(r => r.count > 0);
*/

const oldReact = `// Optimistic UI update
    if (!message.reactions) message.reactions = [];
    const existing = message.reactions.find(r => r.emoticon === emoticon);
    let remove = false;
    
    if (existing) {
      if (existing.chosenOrder !== undefined && existing.chosenOrder !== null) {
        existing.count = Math.max(0, existing.count - 1);
        existing.chosenOrder = null;
        remove = true;
      } else {
        existing.count += 1;
        existing.chosenOrder = 0;
      }
    } else {
      message.reactions.push({ emoticon, count: 1, chosenOrder: 0 });
    }
    message.reactions = message.reactions.filter(r => r.count > 0);`;

const newReact = `// We skip direct mutation here to prevent read-only prop errors in strict mode.
    // Instead we can dispatch an event to the parent window to update state if needed,
    // or just let the socket handle it when it comes back from the server.
    
    let remove = false;
    if (message.reactions) {
      const existing = message.reactions.find(r => r.emoticon === emoticon);
      if (existing && existing.chosenOrder !== undefined && existing.chosenOrder !== null) {
        remove = true;
      }
    }
    
    // Dispatch a custom event to optimistically update in the parent
    window.dispatchEvent(new CustomEvent('optimistic-react', {
      detail: { messageId: message.id, emoticon, remove }
    }));
`;

code = code.replace(oldReact, newReact);
fs.writeFileSync('src/components/MessageItem.tsx', code);
