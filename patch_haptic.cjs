const fs = require('fs');
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf8');

if (!code.includes('import { triggerHaptic } from "../utils/haptics";') && !code.includes('import { triggerHaptic }')) {
  code = code.replace(
    'import React, {',
    'import { triggerHaptic } from "../utils/haptics";\nimport React, {'
  );
}

// Add haptic to new_message
code = code.replace(
  'return [...prev, msg];\n        });',
  'if (!msg.out) { triggerHaptic("medium"); }\n          return [...prev, msg];\n        });'
);

// Add haptic to handleSwipeRight (to reply)
code = code.replace(
  'setReplyToMsgId(messageId);\n    inputRef.current?.focus();',
  'setReplyToMsgId(messageId);\n    triggerHaptic("rigid");\n    inputRef.current?.focus();'
);

fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
