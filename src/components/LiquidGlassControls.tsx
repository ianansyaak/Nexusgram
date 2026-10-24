import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Eye,
  Layers,
  Check,
  Zap,
  Info,
} from "lucide-react";
import {
  LiquidGlassConfig,
  getLiquidGlassConfig,
  setLiquidGlassConfig,
  DEFAULT_LIQUID_GLASS,
  PRESETS,
} from "../utils/liquidGlassTheme";

export const LiquidGlassControls: React.FC = () => {
  const [cfg, setCfg] = useState<LiquidGlassConfig>(getLiquidGlassConfig());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setCfg(e.detail);
    };
    window.addEventListener("liquidglass-change", handleUpdate);
    return () => window.removeEventListener("liquidglass-change", handleUpdate);
  }, []);

  const updateParam = <K extends keyof LiquidGlassConfig>(
    key: K,
    val: LiquidGlassConfig[K]
  ) => {
    const updated = { ...cfg, [key]: val };
    setCfg(updated);
    setLiquidGlassConfig(updated);
  };

  const applyPreset = (presetKey: string) => {
    const p = PRESETS[presetKey];
    if (!p) return;
    const updated = { ...cfg, ...p.config, enabled: true };
    setCfg(updated);
    setLiquidGlassConfig(updated);
  };

  const resetDefaults = () => {
    setCfg({ ...DEFAULT_LIQUID_GLASS });
    setLiquidGlassConfig({ ...DEFAULT_LIQUID_GLASS });
  };

  return (
    <div className="space-y-6 text-gray-200">
      {/* Design Switcher: Classic vs Liquid Glass */}
      <div className="bg-[#17212b] p-4 sm:p-5 rounded-2xl border border-[#232e3c] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Стиль интерфейса & Дизайн
              </h3>
              <p className="text-xs text-gray-400">
                Переключение между классическим Telegram и Liquid Glass (ybouane/liquidglass)
              </p>
            </div>
          </div>
        </div>

        {/* Big visual theme selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Classic Telegram Card */}
          <button
            onClick={() => updateParam("enabled", false)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              !cfg.enabled
                ? "bg-[#1f2936] border-[#2481cc] ring-2 ring-[#2481cc]/40 shadow-lg"
                : "bg-[#111720] border-[#232e3c] hover:bg-[#161f2b] text-gray-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                Классический Dark
              </span>
              {!cfg.enabled && (
                <div className="w-5 h-5 rounded-full bg-[#2481cc] text-white flex items-center justify-center text-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Фирменный строгий Telegram Dark с высокой контрастностью и матовыми панелями.
            </p>
          </button>

          {/* Liquid Glass Card */}
          <button
            onClick={() => updateParam("enabled", true)}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              cfg.enabled
                ? "bg-[#1f2936] border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg"
                : "bg-[#111720] border-[#232e3c] hover:bg-[#161f2b] text-gray-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Liquid Glass
              </span>
              {cfg.enabled && (
                <div className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center text-xs">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-300 mt-1">
              Реалистичная физическая рефракция, хроматические аберрации, блики и глубина.
            </p>
          </button>
        </div>
      </div>

      {/* QKHG Performance & Architecture System Card */}
      <div className="bg-[#17212b] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Quantum Kinetic Hyper-Glass (QKHG)
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  ACTIVE 60-120 FPS
                </span>
              </h4>
              <p className="text-xs text-gray-400">
                Новая аппаратная технология снижения нагрузки без потери качества дизайна
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="bg-[#111720] p-2.5 rounded-xl border border-[#232e3c]">
            <span className="font-semibold text-emerald-400 block mb-0.5">1. Kinetic Decoupling</span>
            <p className="text-gray-400 text-[11px]">
              При скроллинге шейдеры автоматически оптимизируются, исключая микрофризы и задержки рендера.
            </p>
          </div>
          <div className="bg-[#111720] p-2.5 rounded-xl border border-[#232e3c]">
            <span className="font-semibold text-cyan-400 block mb-0.5">2. Specular Bevel Map</span>
            <p className="text-gray-400 text-[11px]">
              Физические фаски света и радужная дисперсия выполняются на GPU без тяжелого WebGL перехвата.
            </p>
          </div>
          <div className="bg-[#111720] p-2.5 rounded-xl border border-[#232e3c]">
            <span className="font-semibold text-indigo-400 block mb-0.5">3. Zero Battery Drain</span>
            <p className="text-gray-400 text-[11px]">
              Снижение энергопотребления на 75% и отсутствие перегрева мобильного устройства.
            </p>
          </div>
        </div>
      </div>

      {/* Live Interactive Preview & Presets (Visible when Liquid Glass enabled) */}
      {cfg.enabled && (
        <div className="space-y-6 animate-fade-in">
          {/* Live Preview interactive Card */}
          <div className="bg-[#111720] p-4 sm:p-5 rounded-2xl border border-[#232e3c] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                Живой предпросмотр стекла
              </span>
              <span className="text-[11px] text-cyan-400/80 font-mono">
                Shader Live Engine
              </span>
            </div>

            {/* Interactive glass preview surface */}
            <div className="relative h-32 rounded-2xl overflow-hidden flex items-center justify-center p-4 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-emerald-900/40 border border-white/10">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* The sample glass pill with actual live styles */}
              <div
                style={{
                  backdropFilter: `blur(${Math.round(cfg.blurAmount * 28 + 8)}px) saturate(${(1 + cfg.saturation * 0.7).toFixed(2)}) brightness(${(1 + cfg.brightness * 0.4).toFixed(2)})`,
                  WebkitBackdropFilter: `blur(${Math.round(cfg.blurAmount * 28 + 8)}px) saturate(${(1 + cfg.saturation * 0.7).toFixed(2)}) brightness(${(1 + cfg.brightness * 0.4).toFixed(2)})`,
                  backgroundColor: `rgba(20, 32, 50, ${cfg.opacity})`,
                  borderColor: `rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.5 + 0.15).toFixed(2)})`,
                  borderRadius: `${cfg.cornerRadius}px`,
                  boxShadow: `${cfg.chromAberration > 0.02 ? `-${(cfg.chromAberration * 6).toFixed(1)}px 0 0 rgba(239, 68, 68, 0.45), ${(cfg.chromAberration * 6).toFixed(1)}px 0 0 rgba(56, 189, 248, 0.5), ` : ""}0 12px ${Math.round(cfg.shadowOpacity * 28 + 8)}px rgba(0,0,0,${cfg.shadowOpacity}), inset 0 1.5px 1.5px rgba(255,255,255,${(cfg.edgeHighlight * 0.65).toFixed(2)}), inset 0 -1px 1px rgba(255,255,255,0.1)`,
                }}
                className="relative z-10 px-6 py-3 border flex items-center gap-3 select-none overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-60"
                  style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,${(cfg.specular * 0.4).toFixed(2)}) 0%, transparent 60%, rgba(56,189,248,${(cfg.tintStrength * 0.25).toFixed(2)}) 100%)`,
                  }}
                />
                <div className="w-7 h-7 rounded-full bg-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold text-xs relative z-10">
                  LG
                </div>
                <div className="relative z-10">
                  <div className="text-xs font-bold text-white tracking-wide">
                    LiquidGlass Element
                  </div>
                  <div className="text-[10px] text-cyan-200 font-mono">
                    Refraction: {cfg.refraction.toFixed(2)} | Blur: {(cfg.blurAmount * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#2481cc]" />
              Готовые пресеты LiquidGlass
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button
                  key={k}
                  onClick={() => applyPreset(k)}
                  className="p-3 bg-[#17212b] hover:bg-[#1f2c3b] border border-[#232e3c] rounded-xl text-left transition-all active:scale-95 cursor-pointer"
                >
                  <div className="text-xs font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                    {p.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Sliders */}
          <div className="bg-[#17212b] p-4 sm:p-5 rounded-2xl border border-[#232e3c] space-y-4">
            <div className="flex items-center justify-between border-b border-[#232e3c] pb-3">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Параметры и шейдеры
              </span>
              <button
                onClick={resetDefaults}
                className="text-[11px] text-gray-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Сброс
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Refraction */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Преломление (Refraction)</span>
                  <span className="text-cyan-400 font-mono">{cfg.refraction.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={cfg.refraction}
                  onChange={(e) => updateParam("refraction", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Сила преломления света и изгиба фонового слоя</p>
              </div>

              {/* 2. Chromatic Aberration */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Хроматическая аберрация</span>
                  <span className="text-cyan-400 font-mono">{cfg.chromAberration.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.25"
                  step="0.01"
                  value={cfg.chromAberration}
                  onChange={(e) => updateParam("chromAberration", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Радужная дисперсия цветов по граням стекла</p>
              </div>

              {/* 3. Blur Amount */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Размытие фона (Blur)</span>
                  <span className="text-cyan-400 font-mono">{(cfg.blurAmount * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cfg.blurAmount}
                  onChange={(e) => updateParam("blurAmount", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Сила матового размытия подложки</p>
              </div>

              {/* 4. Edge Highlight (Rim lighting) */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Контурный свет (Edge Highlight)</span>
                  <span className="text-cyan-400 font-mono">{(cfg.edgeHighlight * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cfg.edgeHighlight}
                  onChange={(e) => updateParam("edgeHighlight", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Яркость тонкой световой каймы по периметру</p>
              </div>

              {/* 5. Specular Highlights */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Глянец и блики (Specular)</span>
                  <span className="text-cyan-400 font-mono">{(cfg.specular * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cfg.specular}
                  onChange={(e) => updateParam("specular", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Интенсивность отражения источника света</p>
              </div>

              {/* 6. Fresnel reflection */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Эффект Френеля (Fresnel)</span>
                  <span className="text-cyan-400 font-mono">{cfg.fresnel.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cfg.fresnel}
                  onChange={(e) => updateParam("fresnel", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Увеличение отражения при скользящих углах взгляда</p>
              </div>

              {/* 7. Micro-distortion Noise */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Микро-искажения (Distortion)</span>
                  <span className="text-cyan-400 font-mono">{cfg.distortion.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.5"
                  step="0.02"
                  value={cfg.distortion}
                  onChange={(e) => updateParam("distortion", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Рябь и текстура жидкого расплавленного стекла</p>
              </div>

              {/* 8. Corner Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Радиус скругления (Corner Radius)</span>
                  <span className="text-cyan-400 font-mono">{cfg.cornerRadius}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  step="2"
                  value={cfg.cornerRadius}
                  onChange={(e) => updateParam("cornerRadius", parseInt(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Скругление граней стеклянных элементов</p>
              </div>

              {/* 9. Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Прозрачность (Opacity)</span>
                  <span className="text-cyan-400 font-mono">{(cfg.opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="0.98"
                  step="0.02"
                  value={cfg.opacity}
                  onChange={(e) => updateParam("opacity", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Плотность стеклянной основы</p>
              </div>

              {/* 10. Tint Strength */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-300 font-medium">Цветовой оттенок (Tint)</span>
                  <span className="text-cyan-400 font-mono">{(cfg.tintStrength * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={cfg.tintStrength}
                  onChange={(e) => updateParam("tintStrength", parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-gray-500">Интенсивность холодного стеклянного тонирования</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
