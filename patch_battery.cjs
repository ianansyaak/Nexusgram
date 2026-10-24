const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicIsland.tsx', 'utf8');

code = code.replace(
  `b.onlevelchange = () => setBattery(Math.round(b.level * 100));
        b.onchargingchange = () => setIsCharging(b.charging);`,
  `b.addEventListener('levelchange', () => setBattery(Math.round(b.level * 100)));
        b.addEventListener('chargingchange', () => setIsCharging(b.charging));`
);

fs.writeFileSync('src/components/DynamicIsland.tsx', code);
