import fs from 'fs';
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');

const target = `            {isTyping && (
              <div className="absolute -top-7 left-4 flex items-center gap-2 animate-fade-in">`;

const replacement = `            {showAttachmentMenu && (
              <div className="absolute bottom-full mb-2 left-2 w-64 bg-[#181824] border border-[#2a2a38] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in z-50">
                <button
                  onClick={() => { setShowAttachmentMenu(false); galleryInputRef.current?.click(); }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-blue-400" /> Из галереи (Фото/Видео)
                </button>
                <button
                  onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <Folder className="w-5 h-5 text-indigo-400" /> Файл с устройства
                </button>
                <button
                  onClick={async () => {
                    setShowAttachmentMenu(false);
                    try {
                      const items = await navigator.clipboard.read();
                      for (const item of items) {
                        for (const type of item.types) {
                          if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            setFiles(prev => [...prev, new File([blob], "clipboard_image.png", { type })]);
                          }
                        }
                      }
                    } catch (e) {
                      console.error("Failed to read clipboard");
                    }
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-orange-400" /> Из буфера обмена
                </button>
              </div>
            )}
            
            {showStickerPicker && (
              <div className="absolute bottom-full mb-2 left-2 sm:left-12 w-[320px] max-w-[90vw] h-64 bg-[#181824] border border-[#2a2a38] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in z-50">
                <div className="p-3 border-b border-[#2a2a38] bg-[#111116] flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-200">Недавние стикеры</h3>
                  <button onClick={() => setShowStickerPicker(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 sm:grid-cols-5 gap-2 scrollbar-thin">
                  {recentStickers.length === 0 ? (
                     <div className="col-span-full text-center text-xs text-gray-500 mt-10">
                        Загрузка стикеров...
                     </div>
                  ) : recentStickers.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => {
                        setShowStickerPicker(false);
                        // Download the sticker as a file and send it
                        fetch(\`/api/telegram/doc/\${s.id}/\${s.accessHash}?fileRef=\${s.fileReference}\`)
                          .then(r => r.blob())
                          .then(blob => {
                            const file = new File([blob], "sticker." + (s.mimeType === "application/x-tgsticker" ? "tgs" : "webp"), { type: s.mimeType });
                            setFiles([file]); // Or immediately send
                            // Let's send immediately
                            const formData = new FormData();
                            formData.append("files", file);
                            formData.append("chatId", chatId);
                            fetch("/api/telegram/send", { method: "POST", body: formData }).then(handleSendResponse);
                          });
                      }}
                      className="aspect-square rounded-xl hover:bg-gray-700/50 cursor-pointer flex items-center justify-center p-1 relative group"
                    >
                      <img src={\`/api/telegram/doc/\${s.id}/\${s.accessHash}?fileRef=\${s.fileReference}\`} className="w-full h-full object-contain drop-shadow-md" alt={s.emoji} />
                      {s.emoji && <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 rounded-full px-1 opacity-0 group-hover:opacity-100">{s.emoji}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="absolute -top-7 left-4 flex items-center gap-2 animate-fade-in">`;

if(code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
   console.log("Patched successfully");
} else {
   console.log("Target not found");
}
