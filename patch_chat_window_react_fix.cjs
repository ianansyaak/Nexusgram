const fs = require('fs');
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf8');

// We need to map over reactions to clone the existing item before modifying it.
const oldLogic = `          const existing = reactions.find(r => r.emoticon === emoticon);
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
          }`;

const newLogic = `          let found = false;
          const newReactions = reactions.map(r => {
            if (r.emoticon === emoticon) {
              found = true;
              return { 
                ...r, 
                count: remove ? Math.max(0, r.count - 1) : r.count + 1, 
                chosenOrder: remove ? null : 0 
              };
            }
            return r;
          });
          if (!found && !remove) {
            newReactions.push({ emoticon, count: 1, chosenOrder: 0 });
          }
          return { ...msg, reactions: newReactions.filter(r => r.count > 0) };`;

code = code.replace(oldLogic, newLogic);

// We also need to remove the extra return statement from the previous patch
code = code.replace(`          return { ...msg, reactions: reactions.filter(r => r.count > 0) };`, '');

fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
