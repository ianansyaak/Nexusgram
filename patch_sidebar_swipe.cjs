const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(/onDragStart=\{\(\) => setSwipedId\(dialog\.id\)\}/g, '');
code = code.replace(/animate=\{\{ x: swipedId === dialog\.id \? -120 : 0 \}\}/g, 'animate={{ x: swipedId === dialog.id ? -120 : 0 }}');

fs.writeFileSync('src/components/Sidebar.tsx', code);
