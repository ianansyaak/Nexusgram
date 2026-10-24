const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// Update avatar size
code = code.replace(/className="w-12 h-12 relative flex-shrink-0"/g, 'className="w-14 h-14 relative flex-shrink-0"');
code = code.replace(/<div className="w-12 h-12 rounded-full overflow-hidden border border-\[#2a2a38\] bg-\[#1a1a24\] flex items-center justify-center text-lg shadow-sm">/g, 
  '<div className="w-14 h-14 rounded-full overflow-hidden border border-[#2a2a38] bg-[#1a1a24] flex items-center justify-center text-xl shadow-sm">');
code = code.replace(/<div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium shadow-sm"/g, 
  '<div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-medium shadow-sm"');

// Update date font size
code = code.replace(/text-\[11px\] text-gray-500 whitespace-nowrap tabular-nums/g, 'text-[9px] text-gray-500 whitespace-nowrap tabular-nums font-medium');

// Update connection indicator logic
// "верни индикатор связи на профиле, он должен показывать соединение с интернетом, если инет отключена то он должен грузиться"
// We'll add a 'isOnline' state.
if (!code.includes('const [isOnline, setIsOnline] = useState(true);')) {
  code = code.replace('const [isTelegramConnected, setIsTelegramConnected] = useState(true);', 
    'const [isTelegramConnected, setIsTelegramConnected] = useState(true);\n  const [isOnline, setIsOnline] = useState(navigator.onLine);\n  useEffect(() => {\n    const handleOnline = () => setIsOnline(true);\n    const handleOffline = () => setIsOnline(false);\n    window.addEventListener("online", handleOnline);\n    window.addEventListener("offline", handleOffline);\n    return () => {\n      window.removeEventListener("online", handleOnline);\n      window.removeEventListener("offline", handleOffline);\n    };\n  }, []);');
}

// Update the profile header UI
code = code.replace(
  `{!isTelegramConnected ? "Подключение..." : "Онлайн"}`,
  `{!isOnline ? "Нет сети..." : (!isTelegramConnected ? "Подключение..." : "Онлайн")}`
);

code = code.replace(
  `title={isTelegramConnected ? "Профиль пользователя" : "Подключение к Telegram..."}`,
  `title={!isOnline ? "Ожидание сети..." : (isTelegramConnected ? "Профиль пользователя" : "Подключение к Telegram...")}`
);

// We need a spinner for offline
code = code.replace(
  `<span className={\`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0e1621] \${isTelegramConnected ? 'bg-emerald-500' : 'bg-amber-400'}\`} />`,
  `{!isOnline ? (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#0e1621] rounded-full flex items-center justify-center">
                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                </div>
              ) : (
                <span className={\`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0e1621] \${isTelegramConnected ? 'bg-emerald-500' : 'bg-amber-400'}\`} />
              )}`
);
if (!code.includes("Loader2")) {
  code = code.replace('import { Settings, ', 'import { Loader2, Settings, ');
}

fs.writeFileSync('src/components/Sidebar.tsx', code);
