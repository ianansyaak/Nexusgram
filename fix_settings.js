import fs from 'fs';

let code = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

// Add state for API Keys
if (!code.includes('const [aiApiKey, setAiApiKey]')) {
    code = code.replace(
        'const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(localStorage.getItem("nexus_dynamic_island") !== "false");',
        `const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(localStorage.getItem("nexus_dynamic_island") !== "false");\n  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem("nexus_ai_api_key") || "");`
    );
}

// Add AI Settings tab
if (!code.includes('setActiveTab("ai")')) {
    code = code.replace(
        '<button\n            onClick={() => setActiveTab("plugins")}',
        `<button
            onClick={() => setActiveTab("ai")}
            className={\`flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer \${
              activeTab === "ai"
                ? "border-[#2481cc] text-[#2481cc]"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }\`}
          >
            <Cpu className="w-4 h-4" />
            Нейросети
          </button>
          <button
            onClick={() => setActiveTab("plugins")}`
    );
}

// Add content for AI tab
const aiTabContent = `
          {activeTab === "ai" && (
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#2481cc]" />
                      API Ключ Нейросети
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Введите свой API-ключ Gemini (Google) или OpenAI (ChatGPT) для работы ИИ-ассистента.
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Например: AIzaSy..."
                    value={aiApiKey}
                    onChange={(e) => {
                      setAiApiKey(e.target.value);
                      localStorage.setItem("nexus_ai_api_key", e.target.value);
                    }}
                    className="w-full bg-[#111922] border border-[#263445] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#2481cc] transition-colors placeholder-gray-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">
                    Этот ключ сохраняется только в вашем браузере (localStorage) и используется для отправки запросов напрямую к провайдеру ИИ.
                  </p>
                </div>
              </div>
            </div>
          )}
`;

if (!code.includes('activeTab === "ai" && (')) {
    code = code.replace(
        '{activeTab === "general" && (',
        `${aiTabContent}\n          {activeTab === "general" && (`
    );
}

fs.writeFileSync('src/components/SettingsModal.tsx', code);
console.log('Fixed settings');
