import fs from 'fs';

let serverCode = fs.readFileSync('server.ts', 'utf-8');

// 1. In /api/chat, use dynamic API key if provided
const chatSearch = 'app.post("/api/chat", async (req, res) => {';
const chatReplace = `app.post("/api/chat", async (req, res) => {
    let customAi = ai;
    if (req.headers['x-gemini-key']) {
        customAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] });
    }
    if (!customAi) {
      return res.status(500).json({ error: "API key is missing" });
    }`;
serverCode = serverCode.replace(chatSearch, chatReplace);
serverCode = serverCode.replace('if (!ai) {', '// if (!ai) {');
serverCode = serverCode.replace('return res.status(500).json({ error: "API key is missing" });', '// return res.status(500).json({ error: "API key is missing" });');
serverCode = serverCode.replace('const aiResponse = await ai.models.generateContent({', 'const aiResponse = await customAi.models.generateContent({');

// 2. In /api/telegram/translate, use dynamic API key
const translateSearch = 'app.post("/api/telegram/translate", async (req, res) => {';
const translateReplace = `app.post("/api/telegram/translate", async (req, res) => {
    let customAi = ai;
    if (req.headers['x-gemini-key']) {
        customAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] });
    }`;
serverCode = serverCode.replace(translateSearch, translateReplace);
serverCode = serverCode.replace('const response = await ai.models.generateContent({', 'if (!customAi) return res.status(500).json({ error: "No AI" });\n      const response = await customAi.models.generateContent({');


fs.writeFileSync('server.ts', serverCode);
console.log('Fixed server.ts');
