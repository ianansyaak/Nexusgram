const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  /absolute inset-y-0 right-0 flex items-center justify-end pr-3 gap-2 rounded-2xl bg-\[#1c1c28\] transition-all duration-200 \$\{swipedId === dialog\.id \? 'opacity-100' : 'opacity-0 pointer-events-none'\}/g,
  'absolute inset-y-0 right-0 flex items-center justify-end pr-3 gap-2 rounded-2xl bg-[#1c1c28]'
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
