import fs from 'fs';

if (fs.existsSync('src/components/ChatWindow.tsx')) {
  let code = fs.readFileSync('src/components/ChatWindow.tsx', 'utf-8');

  code = code.replace(
      'fetch("/api/chat", {',
      `fetch("/api/chat", {
        headers: {
          "Content-Type": "application/json",
          "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || ""
        },`
  );

  fs.writeFileSync('src/components/ChatWindow.tsx', code);
}
