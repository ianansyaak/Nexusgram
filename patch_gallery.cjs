const fs = require('fs');
let code = fs.readFileSync('src/components/ChatWindow.tsx', 'utf8');

const replacement = `
          <div className="relative flex items-end gap-2 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30">
            <label className="p-3 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5" title="Прикрепить файл">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
            </label>
            <label className="p-3 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5" title="Галерея (Фото и видео)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
`;

code = code.replace(
  '<div className="relative flex items-end gap-2 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30">\n            <label className="p-3 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5" title="Прикрепить файл">\n              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>\n              <input type="file" multiple className="hidden" onChange={handleFileChange} />\n            </label>',
  replacement
);

fs.writeFileSync('src/components/ChatWindow.tsx', code);
