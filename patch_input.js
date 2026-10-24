import fs from 'fs';
let code = fs.readFileSync('src/components/TelegramChatWindow.tsx', 'utf-8');

const target = `                  <label
                    className={\`p-3 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 \${botCommands && botCommands.length > 0 ? '' : 'ml-0.5'}\`}
                    title="Прикрепить файл"
                  >
                    <Paperclip className="w-5 h-5" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                  <label
                    className="p-3 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5"
                    title="Галерея (Фото и видео)"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>`;

const replacement = `                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={\`p-3 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 \${botCommands && botCommands.length > 0 ? '' : 'ml-0.5'} \${showAttachmentMenu ? 'bg-[#1a1a24] text-blue-400' : ''}\`}
                    title="Вложения"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                  <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
                  
                  <button
                    onClick={() => setShowStickerPicker(!showStickerPicker)}
                    className={\`p-3 text-gray-400 hover:text-orange-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 \${showStickerPicker ? 'bg-[#1a1a24] text-orange-400' : ''}\`}
                    title="Стикеры"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>`;

if(code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/components/TelegramChatWindow.tsx', code);
   console.log("Patched successfully");
} else {
   console.log("Target not found");
}
