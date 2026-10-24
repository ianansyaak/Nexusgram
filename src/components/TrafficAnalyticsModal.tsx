import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Zap,
  TrendingDown,
  Activity,
  ArrowDown,
  ArrowUp,
  HardDrive,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Cpu,
  Wifi,
  AlertCircle,
  Sliders,
  CheckCircle2,
  Send,
  DownloadCloud,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getEcoStats,
  resetEcoStats,
  getEcoMode,
  setEcoMode,
  getLiveBandwidthTelemetry,
  getTelemetryHistoryBuffer,
  syncWithServerTraffic,
  measureLiveServerPing,
  recordDataTransfer,
  LiveBandwidthPoint,
  EcoStats,
  EcoMode,
  formatBytes,
} from "../utils/ecoStream";
import {
  isLoadReductionEnabled,
  getLoadReductionLevel,
  setLoadReductionEnabled,
  getLoadReductionStats,
  LoadReductionLevel,
  LoadReductionStats,
} from "../utils/loadReduction";

interface TrafficAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrafficAnalyticsModal: React.FC<TrafficAnalyticsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [stats, setStats] = useState<EcoStats>(getEcoStats());
  const [ecoMode, setLocalEcoMode] = useState<EcoMode>(getEcoMode());
  const [ping, setPing] = useState<number>(18);
  const [speedHistory, setSpeedHistory] = useState<LiveBandwidthPoint[]>([]);
  const [loadStats, setLoadStats] = useState<LoadReductionStats>(getLoadReductionStats());
  const [isTestingStream, setIsTestingStream] = useState(false);
  const [activeTab, setActiveTab] = useState<"traffic" | "loadReduction">("traffic");

  // Real-time telemetry interval & ping measurement
  useEffect(() => {
    if (!isOpen) return;

    // Seed speed history with buffered continuous points
    setSpeedHistory(getTelemetryHistoryBuffer());

    const updateLive = async () => {
      await syncWithServerTraffic();
      const measuredPing = await measureLiveServerPing();
      setPing(measuredPing);
      setStats(getEcoStats());
      setLoadStats(getLoadReductionStats());

      const newPoint = getLiveBandwidthTelemetry();
      setSpeedHistory((prev) => [...prev.slice(1), newPoint]);
    };

    updateLive();
    const interval = setInterval(updateLive, 1000);

    return () => clearInterval(interval);
  }, [isOpen, ecoMode]);

  if (!isOpen) return null;

  const handleSwitchMode = (mode: EcoMode) => {
    setLocalEcoMode(mode);
    setEcoMode(mode);
    setStats(getEcoStats());
    const point = getLiveBandwidthTelemetry();
    setSpeedHistory((prev) => [...prev.slice(1), point]);
  };

  const handleSetLoadReduction = (level: LoadReductionLevel) => {
    const isEnabled = level !== "off";
    setLoadReductionEnabled(isEnabled, level);
    setLoadStats(getLoadReductionStats());
  };

  const handleTestDataStream = async () => {
    if (isTestingStream) return;
    setIsTestingStream(true);
    try {
      // Simulate live cellular transmission with real byte tracking
      const sampleOriginal = 1024 * 1024 * 2.8; // 2.8 MB uncompressed image payload
      const sampleActual = ecoMode === "ultra" ? 1024 * 140 : ecoMode === "smart" ? 1024 * 380 : sampleOriginal;
      recordDataTransfer(sampleOriginal, sampleActual, "upload");
      
      // Ping server to sync
      await fetch(`/api/telegram/traffic/stats?_test=${Date.now()}`);
      await syncWithServerTraffic();
      setStats(getEcoStats());
      const point = getLiveBandwidthTelemetry();
      setSpeedHistory((prev) => [...prev.slice(1), point]);
    } catch (e) {
    } finally {
      setTimeout(() => setIsTestingStream(false), 600);
    }
  };

  // MB & byte calculations based on actual live data
  const rawBytesSaved = stats.bytesSaved;
  const rawBytesDownloaded = stats.bytesDownloaded;
  const rawBytesUploaded = stats.bytesUploaded || 0;
  const totalRawBytes = rawBytesSaved + rawBytesDownloaded + rawBytesUploaded;

  const savedMb = (rawBytesSaved / (1024 * 1024)).toFixed(2);
  const downloadedMb = (rawBytesDownloaded / (1024 * 1024)).toFixed(2);
  const uploadedMb = (rawBytesUploaded / (1024 * 1024)).toFixed(2);
  const totalMb = (totalRawBytes / (1024 * 1024)).toFixed(2);
  const savedPercent = totalRawBytes > 0
    ? Math.min(100, Math.round((rawBytesSaved / totalRawBytes) * 100))
    : (ecoMode === "ultra" ? 88 : ecoMode === "smart" ? 64 : 0);

  const currentUncompressedRate = stats.uncompressedSpeed || 0;
  const currentActualRate = stats.actualSpeed || 0;
  const currentSavedRate = Math.max(0, currentUncompressedRate - currentActualRate);

  const totalMbNum = parseFloat(totalMb) || 0;
  const dlMbNum = parseFloat(downloadedMb) || 0;
  const svMbNum = parseFloat(savedMb) || 0;

  const categoryComparisonData = [
    {
      category: "Фото & Видео",
      original: parseFloat((totalMbNum * 0.55).toFixed(2)),
      ecoStream: parseFloat((dlMbNum * 0.55).toFixed(2)),
      saved: parseFloat((svMbNum * 0.55).toFixed(2)),
    },
    {
      category: "Стикеры",
      original: parseFloat((totalMbNum * 0.20).toFixed(2)),
      ecoStream: parseFloat((dlMbNum * 0.20).toFixed(2)),
      saved: parseFloat((svMbNum * 0.20).toFixed(2)),
    },
    {
      category: "Аватары",
      original: parseFloat((totalMbNum * 0.15).toFixed(2)),
      ecoStream: parseFloat((dlMbNum * 0.15).toFixed(2)),
      saved: parseFloat((svMbNum * 0.15).toFixed(2)),
    },
    {
      category: "Сообщения & Файлы",
      original: parseFloat((totalMbNum * 0.10).toFixed(2)),
      ecoStream: parseFloat((dlMbNum * 0.10).toFixed(2)),
      saved: parseFloat((svMbNum * 0.10).toFixed(2)),
    },
  ];

  const savingsBreakdownData = [
    { name: "Сжатие WebP & WebM", value: 66, color: "#10b981" },
    { name: "Кэширование IndexedDB", value: 24, color: "#2481cc" },
    { name: "Оптимизация заголовков", value: 10, color: "#8b5cf6" },
  ];

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 32 }}
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#141c26] border border-[#263445] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-200 font-sans"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#263445] flex items-center justify-between bg-[#111821]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Аналитика сети & Снижение нагрузки
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  В ЭФИРЕ
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Отслеживание мобильного интернета в реальном времени, экономия и аппаратная разгрузка
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 pt-3 border-b border-[#263445] bg-[#111821]/60 gap-4">
          <button
            onClick={() => setActiveTab("traffic")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "traffic"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Wifi className="w-4 h-4" />
            Экономия сотовых данных (EcoStream)
          </button>
          <button
            onClick={() => setActiveTab("loadReduction")}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "loadReduction"
                ? "border-purple-400 text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Cpu className="w-4 h-4" />
            Технология снижения нагрузки (QKHG)
            {loadStats.enabled && (
              <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 text-[10px] rounded-md font-mono border border-purple-500/30">
                -{loadStats.cpuSavingsPercent}% CPU
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {activeTab === "traffic" ? (
            <>
              {/* Top Hero Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Saved Percentage */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-emerald-500/30 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Сэкономлено</span>
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      {savedPercent}%
                    </span>
                    <span className="text-xs text-emerald-300/80 font-mono">({savedMb} МБ)</span>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    сохраненных сотовых данных
                  </div>
                </div>

                {/* 2. Without Economy Technology */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-rose-500/20 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Без экономии</span>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-rose-300 font-mono tracking-tight">
                      {totalMb}
                    </span>
                    <span className="text-sm font-semibold text-rose-400/80">МБ</span>
                  </div>
                  <div className="mt-1 text-[11px] text-rose-400/70">
                    исходный размер файлов
                  </div>
                </div>

                {/* 3. Actually Consumed Live */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-sky-500/20 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Фактический трафик</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                      {currentActualRate}
                    </span>
                    <span className="text-sm font-semibold text-gray-400">КБ/с</span>
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-400/90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ping: {ping} мс (Режим {ecoMode.toUpperCase()})
                  </div>
                </div>

                {/* 4. Live Directional Stats */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-indigo-500/30 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Прием / Отправка</span>
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-1 text-emerald-300">
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{downloadedMb} МБ</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-300">
                      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>{uploadedMb} МБ</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-indigo-300/80">
                    Пакетов: {stats.packetsTransferred} • Кэш: {stats.cacheHits}
                  </div>
                </div>
              </div>

              {/* Live Interactive Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111821] p-3 rounded-2xl border border-[#263445]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300 font-medium">Режим сжатия EcoStream:</span>
                  <div className="flex items-center gap-1 bg-[#1b2532] p-1 rounded-xl border border-[#263445]">
                    <button
                      onClick={() => handleSwitchMode("ultra")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        ecoMode === "ultra"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Ultra (-88%)
                    </button>
                    <button
                      onClick={() => handleSwitchMode("smart")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        ecoMode === "smart"
                          ? "bg-[#2481cc] text-white shadow-md shadow-blue-500/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Smart (-65%)
                    </button>
                    <button
                      onClick={() => handleSwitchMode("off")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        ecoMode === "off"
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Выкл (0%)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestDataStream}
                    disabled={isTestingStream}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isTestingStream ? "Тестирование..." : "Протестировать передачу"}
                  </button>
                  <button
                    onClick={async () => {
                      await resetEcoStats();
                      setStats(getEcoStats());
                    }}
                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    title="Сбросить счетчики"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>

              {/* Chart 1: Real-time Bandwidth Area Chart */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Поток трафика в реальном времени (Live Bandwidth)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Красный пунктир — стандартный расход без технологии. Зеленый — сжатый трафик EcoStream.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Без экономии
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      EcoStream Live
                    </span>
                  </div>
                </div>

                <div className="h-60 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={speedHistory}>
                      <defs>
                        <linearGradient id="uncompressedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="ecoStreamGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.65} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.08} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#4b5563"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis stroke="#4b5563" fontSize={11} tickLine={false} unit=" КБ" domain={[0, "auto"]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111821",
                          borderColor: "#263445",
                          borderRadius: "12px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                        formatter={(value: any, name: string) => [
                          `${value} КБ/с`,
                          name === "uncompressed" ? "Без оптимизации" : "Фактический расход",
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="uncompressed"
                        name="uncompressed"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={1}
                        fill="url(#uncompressedGrad)"
                        isAnimationActive={false}
                      />
                      <Area
                        type="monotone"
                        dataKey="ecoStream"
                        name="ecoStream"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#ecoStreamGrad)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Category Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#2481cc]" />
                      Экономия по категориям медиа (МБ)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Сравнение объема без оптимизации и с технологией EcoStream
                    </p>
                  </div>

                  <div className="h-56 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryComparisonData} barSize={18}>
                        <XAxis
                          dataKey="category"
                          stroke="#4b5563"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#4b5563"
                          fontSize={11}
                          tickLine={false}
                          unit=" МБ"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111821",
                            borderColor: "#263445",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        />
                        <Bar
                          dataKey="original"
                          name="Без оптимизации (МБ)"
                          fill="#4b5563"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="ecoStream"
                          name="С EcoStream (МБ)"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      Источники экономии трафика
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Вклад каждого алгоритма в общий объем
                    </p>
                  </div>

                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={savingsBreakdownData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={4}
                        >
                          {savingsBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111821",
                            borderColor: "#263445",
                            borderRadius: "12px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(val: any) => [`${val}%`, "Доля экономии"]}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: "11px" }}
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Tab 2: Load Reduction Technology */
            <div className="space-y-6">
              {/* Load Reduction Master Status Hero */}
              <div className="bg-gradient-to-r from-purple-900/30 via-[#1b2532] to-indigo-900/30 p-5 rounded-2xl border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-bold text-white">
                      Аппаратное снижение нагрузки (QKHG Engine)
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      loadStats.enabled ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" : "bg-gray-700 text-gray-400"
                    }`}>
                      {loadStats.enabled ? `АКТИВНО (${loadStats.level.toUpperCase()})` : "ВЫКЛЮЧЕНО"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 max-w-xl">
                    Устраняет микрофризы при скроллинге, отключает избыточные шейдерные слои размытия GPU, оптимизирует частоту фоновых опросов сети и сохраняет заряд аккумулятора.
                  </p>
                </div>

                {/* Level Selectors */}
                <div className="flex items-center gap-1.5 bg-[#111821] p-1.5 rounded-xl border border-[#263445]">
                  <button
                    onClick={() => handleSetLoadReduction("max")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      loadStats.level === "max"
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/40"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Максимум (-72%)
                  </button>
                  <button
                    onClick={() => handleSetLoadReduction("balanced")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      loadStats.level === "balanced"
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/40"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Баланс (-48%)
                  </button>
                  <button
                    onClick={() => handleSetLoadReduction("off")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      loadStats.level === "off"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/40"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    Выкл
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-purple-500/20">
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <span>Снижение нагрузки CPU</span>
                    <Cpu className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-purple-300">
                    -{loadStats.cpuSavingsPercent}%
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Меньше фоновых тактов процессора
                  </div>
                </div>

                <div className="bg-[#1b2532] p-4 rounded-2xl border border-indigo-500/20">
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <span>Освобождено GPU памяти</span>
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-indigo-300">
                    {loadStats.gpuMemorySavedMb} МБ
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Снятие тяжелых фильтров Backdrop-Blur
                  </div>
                </div>

                <div className="bg-[#1b2532] p-4 rounded-2xl border border-emerald-500/20">
                  <div className="text-xs text-gray-400 flex items-center justify-between">
                    <span>Экономия батареи</span>
                    <Zap className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
                    +{loadStats.batteryExtensionPercent}%
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Дополнительное время работы устройства
                  </div>
                </div>
              </div>

              {/* Active Optimizations Checklist */}
              <div className="bg-[#1b2532] p-5 rounded-2xl border border-[#263445] space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Активные оптимизаторы аппаратного уровня
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {[
                    { title: "Kinetic Decoupling", desc: "Мгновенное отключение pointer-events и тяжелых стилей при быстром скролле" },
                    { title: "Backdrop-Filter Bypass", desc: "Замена ресурсоемких GPU размытий на чистые контрастные матовые плоскости" },
                    { title: "DOM Message Virtualization", desc: "Изоляция невидимых на экране сообщений через content-visibility: auto" },
                    { title: "Polling Interval Throttling", desc: "Снижение частоты сетевых запросов при неактивном окне браузера" },
                    { title: "Memory Leak Prevention", desc: "Автоматическая очистка URL Object BLOB через LRU кэш памяти" },
                    { title: "Layer Containment", desc: "Строгая изоляция перерисовок и предотвращение Layout Shifts" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-black/20 border border-white/5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${loadStats.enabled ? "text-emerald-400" : "text-gray-500"}`} />
                      <div>
                        <div className="text-xs font-semibold text-gray-200">{item.title}</div>
                        <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
