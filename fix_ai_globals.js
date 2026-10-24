import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

// I will define a helper function at the top of server.ts or just replace `customAi` with `ai` inside transcribe, or define customAi there.
const searchStr = `
        const base64Data = rawBuffer.toString("base64");
        if (!customAi) return res.status(500).json({ error: "No AI" });
      const response = await customAi.models.generateContent({
`;
const replaceStr = `
        const base64Data = rawBuffer.toString("base64");
        
        let localAi = ai;
        if (req.headers['x-gemini-key']) {
           localAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] as string });
        }
        if (!localAi) return res.status(500).json({ error: "No AI" });

        const response = await localAi.models.generateContent({
`;

if (code.includes('if (!customAi) return res.status(500).json({ error: "No AI" });')) {
    code = code.replace(searchStr, replaceStr);
}

// Check other occurrences of customAi
fs.writeFileSync('server.ts', code);
