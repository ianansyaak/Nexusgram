const fs = require('fs');

// server.ts patch
let serverCode = fs.readFileSync('server.ts', 'utf8');
const manifestRoute = `
  app.post("/api/update-manifest-icon", (req, res) => {
    try {
      const { iconUrl } = req.body;
      const manifestPath = path.join(process.cwd(), "public", "manifest.json");
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.icons = [
          { src: iconUrl, sizes: "192x192", type: "image/png" },
          { src: iconUrl, sizes: "512x512", type: "image/png" }
        ];
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
      res.json({ success: true });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!serverCode.includes('/api/update-manifest-icon')) {
  serverCode = serverCode.replace(
    'app.get("/api/ping", (req, res) => {',
    manifestRoute + '\n  app.get("/api/ping", (req, res) => {'
  );
  fs.writeFileSync('server.ts', serverCode);
}

// SettingsModal.tsx patch
let settingsCode = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');
settingsCode = settingsCode.replace(
  'if (linkIcon) linkIcon.href = url;\n    if (linkApple) linkApple.href = url;',
  `if (linkIcon) linkIcon.href = url;
    if (linkApple) linkApple.href = url;
    fetch("/api/update-manifest-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconUrl: url })
    }).catch(console.error);`
);
fs.writeFileSync('src/components/SettingsModal.tsx', settingsCode);

