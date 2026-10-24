import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// Fix the try block in /api/telegram/translate
// Basically, we have this:
/*
app.post("/api/telegram/translate", async (req, res) => {
    let customAi = ai;
    if (req.headers['x-gemini-key']) {
        customAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] });
    }
    try {
*/
code = code.replace(
    '// if (!ai) {\n        return res.status(500).json({ error: "Gemini API key is missing" });\n      }\n\n      const response = await ai.models.generateContent({',
    'if (!customAi) return res.status(500).json({ error: "Gemini API key is missing" });\n      const response = await customAi.models.generateContent({'
);

fs.writeFileSync('server.ts', code);
