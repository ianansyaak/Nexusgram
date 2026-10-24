import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf-8');

const oldChat = `
  app.post("/api/chat", async (req, res) => {
    let customAi = ai;
    if (req.headers['x-gemini-key']) {
        customAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] });
    }
    if (!customAi) {
      // return res.status(500).json({ error: "API key is missing" });
    }
    // if (!ai) {
      // return res.status(500).json({ error: "API key is missing" });
    // }
`;

const replaceChat = `
  app.post("/api/chat", async (req, res) => {
    let customAi = ai;
    if (req.headers['x-gemini-key']) {
        customAi = new GoogleGenAI({ apiKey: req.headers['x-gemini-key'] });
    }
    if (!customAi) {
      return res.status(500).json({ error: "API key is missing" });
    }
`;

// It might be easier to use replace on exact strings.
code = code.replace(/if \(!customAi\) \{\s*\/\/ return res\.status\(500\)\.json\(\{ error: "API key is missing" \}\);\s*\}/, '');
code = code.replace(/if \(!ai\) \{\s*return res\.status\(500\)\.json\(\{ error: "API key is missing" \}\);\s*\}/, 'if (!customAi) { return res.status(500).json({ error: "API key is missing" }); }');
code = code.replace(/\/\/ if \(!ai\) \{/g, '');
code = code.replace(/\/\/ return res\.status\(500\)\.json\(\{ error: "API key is missing" \}\);/g, '');

fs.writeFileSync('server.ts', code);
