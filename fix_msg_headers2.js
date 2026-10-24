import fs from 'fs';

let msgCode = fs.readFileSync('src/components/MessageItem.tsx', 'utf-8');

// Line 233
msgCode = msgCode.replace(
    'headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" }, method: \'POST\', headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" } });',
    'headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" }, method: \'POST\' });'
);

// Line 156-161
msgCode = msgCode.replace(
    '      headers: {\n        "Content-Type": "application/json",\n        "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || ""\n      },\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n',
    '      headers: {\n        "Content-Type": "application/json",\n        "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || ""\n      },\n      method: "POST",\n'
);

fs.writeFileSync('src/components/MessageItem.tsx', msgCode);
