const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf8');

if (!code.includes('import { getStrings }')) {
  code = code.replace(
    'import React, {',
    'import { getStrings } from "../utils/i18n";\nimport React, {'
  );
}

// Inside SettingsModal: add const strings = getStrings(language);
code = code.replace(
  'const [language, setLanguage] = useState(localStorage.getItem("nexus_lang") || "ru");',
  'const [language, setLanguage] = useState(localStorage.getItem("nexus_lang") || "ru");\n  const strings = getStrings(language);'
);

// Replace title and subtitle
code = code.replace('Настройки и Телеметрия', '{strings.settingsTitle}');
code = code.replace('Технические данные, сотовая сеть, трафик и плагины Ayugram', '{strings.settingsSubtitle}');

// Replace tabs
code = code.replace('Телеметрия & Сеть', '{strings.tabTelemetry}');
code = code.replace('Общие & Обложка', '{strings.tabGeneral}');
code = code.replace('Доступы и Датчики', '{strings.tabPermissions}');
code = code.replace('Плагины Ayugram', '{strings.tabPlugins}');
code = code.replace('PWA & Dynamic Island', '{strings.tabIphone}');

// Language and Theme titles
code = code.replace('Тема оформления', '{strings.theme}');
code = code.replace('Язык интерфейса', '{strings.language}');
code = code.replace('Telegram Dark', '{strings.themeDark}');
code = code.replace('Светлая', '{strings.themeLight}');
code = code.replace('Система', '{strings.themeSystem}');

fs.writeFileSync('src/components/SettingsModal.tsx', code);
