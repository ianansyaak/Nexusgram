import fs from 'fs';

// Fix SettingsModal.tsx
let settingsCode = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');
settingsCode = settingsCode.replace(
    'useState<"telemetry" | "general" | "permissions" | "plugins" | "iphone">("telemetry")',
    'useState<"telemetry" | "general" | "permissions" | "plugins" | "iphone" | "ai">("telemetry")'
);
fs.writeFileSync('src/components/SettingsModal.tsx', settingsCode);

// Fix server.ts
let serverCode = fs.readFileSync('server.ts', 'utf-8');
serverCode = serverCode.replace(/req\.headers\['x-gemini-key'\]/g, "req.headers['x-gemini-key'] as string");

// Fix customAi in /api/telegram/transcribe (line ~1759) which I accidentally broke?
// Wait, transcribe doesn't use AI... let's check what is at line 1759.
