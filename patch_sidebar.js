import fs from 'fs';
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

const target1 = `className="flex-1 overflow-y-auto px-2 space-y-1 overflow-x-hidden gpu-accelerated scrollbar-thin scrollbar-thumb-zinc-800"`;
const replacement1 = `className="flex-1 overflow-y-auto overflow-x-hidden gpu-accelerated scrollbar-thin scrollbar-thumb-zinc-800"`;

const target2 = `          return (
          <div key={dialog.id} className="relative group rounded-2xl">
            {/* The swipe actions wrapper behind */}
            <div className={\`absolute inset-y-0 right-0 flex items-center justify-end pr-3 gap-2 rounded-2xl bg-[#1c1c28]\`}>`;
const replacement2 = `          return (
          <div key={dialog.id} className="relative group border-b border-[#1c242f]/60 last:border-0">
            {/* The swipe actions wrapper behind */}
            <div className={\`absolute inset-y-0 right-0 flex items-center justify-end pr-3 gap-2 bg-[#1c1c28]\`}>`;

const target3 = `              className={\`relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors border z-10 touch-pan-y will-change-transform \${
                activeId === dialog.id 
                  ? "bg-blue-500/10 border-blue-500/20" 
                  : "border-transparent hover:bg-[#111116] bg-[#0e1621]"
              }\`}
            >`;
const replacement3 = `              className={\`relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors z-10 touch-pan-y will-change-transform \${
                activeId === dialog.id 
                  ? "bg-[#2b5278] border-[#2b5278]" 
                  : "bg-[#0e1621] hover:bg-[#17212b]"
              }\`}
            >`;

const target4 = `                  <motion.div 
                    onClick={() => onSelectChat("ai-assistant", "ai", "AI Assistant")}
                    className={\`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors border \${
                      activeId === "ai-assistant" 
                        ? "bg-indigo-500/10 border-indigo-500/20" 
                        : "border-transparent hover:bg-[#111116]"
                    }\`}
                  >`;
const replacement4 = `                  <motion.div 
                    onClick={() => onSelectChat("ai-assistant", "ai", "AI Assistant")}
                    className={\`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-[#1c242f]/60 \${
                      activeId === "ai-assistant" 
                        ? "bg-[#2b5278]" 
                        : "bg-[#0e1621] hover:bg-[#17212b]"
                    }\`}
                  >`;

if (code.includes(target1)) code = code.replace(target1, replacement1);
if (code.includes(target2)) code = code.replace(target2, replacement2);
if (code.includes(target3)) code = code.replace(target3, replacement3);
if (code.includes(target4)) code = code.replace(target4, replacement4);

fs.writeFileSync('src/components/Sidebar.tsx', code);
console.log("Patched successfully");
