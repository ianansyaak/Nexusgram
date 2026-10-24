const fs = require('fs');
let code = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

// Add files state
code = code.replace(
  'const [input, setInput] = useState("");',
  'const [input, setInput] = useState("");\n  const [files, setFiles] = useState<File[]>([]);\n  const [isDragging, setIsDragging] = useState(false);'
);

// Add handleDrag and handleDrop
const dragDropLogic = `
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };
`;

code = code.replace(
  'const handleSend = async () => {',
  dragDropLogic + '\n  const handleSend = async () => {'
);

// Wrap ChatWindow in onDragOver / onDrop
code = code.replace(
  '<div className="flex-1 flex flex-col h-full telegram-chat-bg relative select-none">',
  '<div \n      onDragOver={handleDragOver}\n      onDragLeave={handleDragLeave}\n      onDrop={handleDrop}\n      className="flex-1 flex flex-col h-full telegram-chat-bg relative select-none">'
);

// Add dragging overlay
code = code.replace(
  '{/* Background elegant overlay */}',
  `{/* Background elegant overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none m-2"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <p className="text-white font-medium">Перетащите файлы сюда</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>`
);

// Add attachments preview and file button
code = code.replace(
  '<div className="relative flex items-end gap-2 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30">',
  `
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#2a2a38] text-white px-3 py-1.5 rounded-xl text-xs">
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-white cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
              ))}
            </div>
          )}
          <div className="relative flex items-end gap-2 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30">
            <label className="p-3 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5" title="Прикрепить файл">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
`
);

fs.writeFileSync('src/components/ChatWindow.tsx', code);
