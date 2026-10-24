import { useState, useEffect, useRef } from "react";
import { Send, Phone, Lock, Loader2, Key, QrCode, RefreshCw, AlertCircle, Smartphone, ShieldCheck, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { detectCountryByPhone } from "../utils/countryFlags";

export function TelegramLogin({ onStatusChange }: { onStatusChange: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [connected, setConnected] = useState(false);
  
  // Auth modes: "phone" | "qr" | "session"
  const [mode, setMode] = useState<"phone" | "qr" | "session">("phone");
  
  // Phone flow steps: "phone" | "code" | "2fa"
  const [step, setStep] = useState<"phone" | "code" | "2fa">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeHash, setPhoneCodeHash] = useState("");
  const [isCodeViaApp, setIsCodeViaApp] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState("");
  
  // 2FA state
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorHint, setTwoFactorHint] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // QR Flow
  const [qrImage, setQrImage] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const qrPollRef = useRef<NodeJS.Timeout | null>(null);

  // Session input
  const [sessionInput, setSessionInput] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    checkStatus();
    return () => {
      stopQrPolling();
    };
  }, []);

  // Timer for resend code
  useEffect(() => {
    if (step === "code" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);
  
  const checkStatus = async () => {
    try {
      const res = await fetch("/api/telegram/status");
      const data = await res.json();
      setConfigured(data.configured);
      
      if (data.connected) {
        setConnected(true);
        onStatusChange();
        try {
          const sRes = await fetch("/api/telegram/session");
          const sData = await sRes.json();
          if (sData.session) {
            localStorage.setItem("telegram_session", sData.session);
          }
        } catch (e) {}
      } else {
        // Auto-restore session from localStorage if present
        const localSession = localStorage.getItem("telegram_session");
        if (localSession && localSession.trim()) {
          try {
            const rRes = await fetch("/api/telegram/session/restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ session: localSession.trim() }),
            });
            const rData = await rRes.json();
            if (rData.connected) {
              setConnected(true);
              onStatusChange();
              return;
            }
          } catch (rErr) {
            console.warn("[Telegram] Auto-restore error:", rErr);
          }
        }
        setConnected(false);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handlePhoneInputChange = (val: string) => {
    // If user starts typing Russian 89..., convert to +79...
    let clean = val;
    if (clean === "8" || (clean.startsWith("8") && clean.length > 1 && !clean.startsWith("+7"))) {
      clean = "+7" + clean.slice(1);
    } else if (clean && !clean.startsWith("+") && !clean.startsWith("8")) {
      clean = "+" + clean;
    }
    setPhoneNumber(clean);
  };
  
  const handleSendCode = async (e: any, forceSMS: boolean = false) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;
    
    setIsLoading(true);
    setError("");
    setResendNotice("");
    
    try {
      const res = await fetch("/api/telegram/auth/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, forceSMS })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPhoneCodeHash(data.phoneCodeHash);
      setIsCodeViaApp(Boolean(data.isCodeViaApp));
      if (data.formattedPhone) setPhoneNumber(data.formattedPhone);
      setCountdown(60);
      setStep("code");
    } catch(e: any) {
      setError(e.message || "Не удалось отправить код");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    if (resending || countdown > 0) return;
    setResending(true);
    setError("");
    setResendNotice("");

    try {
      const res = await fetch("/api/telegram/auth/resendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, phoneCodeHash })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.phoneCodeHash) setPhoneCodeHash(data.phoneCodeHash);
      setIsCodeViaApp(Boolean(data.isCodeViaApp));
      setCountdown(60);
      setResendNotice("Запрос на повторную отправку отправлен! Проверьте SMS и Telegram.");
    } catch (e: any) {
      setError(e.message || "Не удалось отправить код повторно");
    } finally {
      setResending(false);
    }
  };
  
  const handleSignIn = async (e: any) => {
    e.preventDefault();
    if (!phoneCode) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/telegram/auth/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, phoneCodeHash, phoneCode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.requires2FA) {
        setTwoFactorHint(data.hint || "");
        setStep("2fa");
        setIsLoading(false);
        return;
      }
      
      if (data.session) {
        localStorage.setItem("telegram_session", data.session);
      }
      
      setConnected(true);
      setIsOpen(false);
      onStatusChange();
    } catch(e: any) {
      setError(e.message || "Не удалось выполнить вход");
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASignIn = async (e: any) => {
    e.preventDefault();
    if (!twoFactorPassword) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/telegram/auth/checkPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: twoFactorPassword })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверный 2FA пароль");

      if (data.session) {
        localStorage.setItem("telegram_session", data.session);
      }

      setConnected(true);
      setIsOpen(false);
      onStatusChange();
    } catch (e: any) {
      setError(e.message || "Неверный облачный пароль");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreCustomSession = async (e: any) => {
    e.preventDefault();
    if (!sessionInput.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/telegram/session/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: sessionInput.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверная строка сессии");

      localStorage.setItem("telegram_session", sessionInput.trim());
      setConnected(true);
      setIsOpen(false);
      onStatusChange();
    } catch (e: any) {
      setError(e.message || "Не удалось восстановить сессию");
    } finally {
      setIsLoading(false);
    }
  };

  // QR Code Logic
  const startQrLogin = async () => {
    stopQrPolling();
    setQrLoading(true);
    setQrError("");
    setError("");

    try {
      const res = await fetch("/api/telegram/auth/qr/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сгенерировать QR-код");

      if (data.status === "success") {
        if (data.session) localStorage.setItem("telegram_session", data.session);
        setConnected(true);
        setIsOpen(false);
        onStatusChange();
        return;
      }

      setQrImage(data.qrImage || "");
      setQrLoading(false);

      // Start polling status
      qrPollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch("/api/telegram/auth/qr/check");
          const pollData = await pollRes.json();
          if (pollData.status === "success") {
            stopQrPolling();
            if (pollData.session) localStorage.setItem("telegram_session", pollData.session);
            setConnected(true);
            setIsOpen(false);
            onStatusChange();
          } else if (pollData.status === "waiting" && pollData.qrImage && pollData.qrImage !== qrImage) {
            setQrImage(pollData.qrImage);
          }
        } catch (pollErr) {
          console.warn("[QR poll error]:", pollErr);
        }
      }, 2500);
    } catch (e: any) {
      setQrError(e.message || "Ошибка загрузки QR-кода");
      setQrLoading(false);
    }
  };

  const stopQrPolling = () => {
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
  };

  const handleSwitchToQr = () => {
    setMode("qr");
    setStep("phone");
    setError("");
    startQrLogin();
  };

  const handleSwitchToPhone = () => {
    stopQrPolling();
    setMode("phone");
    setError("");
  };

  const handleSwitchToSession = () => {
    stopQrPolling();
    setMode("session");
    setError("");
  };

  if (connected) return null;

  return (
    <>
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={() => {
            setIsOpen(true);
            if (mode === "qr") startQrLogin();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a24] hover:bg-[#22222d] rounded-full text-indigo-400 text-sm font-medium transition-colors border border-indigo-500/20 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
        >
          <Send className="w-4 h-4" />
          Войти в Telegram
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                stopQrPolling();
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#09090e] border border-[#1e1e2d] rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              {!configured ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 mx-auto flex items-center justify-center mb-4">
                    <Key className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-display font-medium text-gray-100 mb-2">Configuration Required</h3>
                  <p className="text-sm text-gray-400">
                    To use Telegram, you need to add your <code className="text-gray-300">TELEGRAM_API_ID</code> and <code className="text-gray-300">TELEGRAM_API_HASH</code> to the environment variables.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center mb-3">
                      {mode === "qr" ? (
                        <QrCode className="w-6 h-6 text-indigo-400" />
                      ) : mode === "session" ? (
                        <Key className="w-6 h-6 text-indigo-400" />
                      ) : (
                        <Send className="w-6 h-6 text-indigo-400" />
                      )}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-gray-100 mb-1">
                      {mode === "qr" 
                        ? "Вход по QR-коду" 
                        : mode === "session" 
                        ? "Вход по строке сессии" 
                        : step === "code" 
                        ? "Код подтверждения" 
                        : step === "2fa" 
                        ? "Облачный пароль 2FA" 
                        : "Вход в Telegram"}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      {mode === "qr"
                        ? "Отсканируйте код камерой в приложении Telegram"
                        : mode === "session"
                        ? "Вставьте готовую строку сессии (StringSession)"
                        : step === "code"
                        ? `Код отправлен для номера ${phoneNumber}`
                        : step === "2fa"
                        ? "Введите пароль двухфакторной аутентификации"
                        : "Выберите удобный способ авторизации в Telegram"}
                    </p>
                  </div>

                  {/* Mode Tabs */}
                  {step === "phone" && (
                    <div className="flex bg-[#12121a] p-1 rounded-2xl mb-5 border border-[#20202e]">
                      <button
                        type="button"
                        onClick={handleSwitchToPhone}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          mode === "phone" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5" /> По номеру
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToQr}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          mode === "qr" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> QR-код <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Быстро</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToSession}
                        className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          mode === "session" ? "bg-indigo-600 text-white shadow-md" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        <Key className="w-3.5 h-3.5" /> Сессия
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">{error}</div>
                    </div>
                  )}

                  {resendNotice && (
                    <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">{resendNotice}</div>
                    </div>
                  )}

                  {/* Mode 1: QR-код */}
                  {mode === "qr" && (
                    <div className="flex flex-col items-center">
                      <div className="w-56 h-56 bg-white rounded-2xl p-3 flex items-center justify-center shadow-lg border-2 border-indigo-500/30 mb-4 relative">
                        {qrLoading ? (
                          <div className="flex flex-col items-center gap-2 text-gray-700">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <span className="text-xs font-medium">Генерация QR-кода...</span>
                          </div>
                        ) : qrError ? (
                          <div className="text-center p-2">
                            <p className="text-xs text-red-500 mb-2">{qrError}</p>
                            <button
                              onClick={startQrLogin}
                              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg font-medium cursor-pointer"
                            >
                              Повторить
                            </button>
                          </div>
                        ) : qrImage ? (
                          <img src={qrImage} alt="Telegram QR Code" className="w-full h-full object-contain" />
                        ) : (
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        )}
                      </div>

                      <div className="w-full bg-[#12121c] border border-white/5 rounded-2xl p-3 mb-4 space-y-2 text-left">
                        <div className="text-[11px] text-gray-300 font-medium flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                          Как войти через QR-код:
                        </div>
                        <ol className="text-[11px] text-gray-400 space-y-1 list-decimal list-inside pl-1">
                          <li>Откройте <b className="text-gray-200">Telegram</b> на смартфоне</li>
                          <li>Перейдите в <b className="text-gray-200">Настройки → Устройства</b></li>
                          <li>Нажмите <b className="text-indigo-400">«Подключить устройство»</b></li>
                          <li>Наведите камеру на QR-код на экране</li>
                        </ol>
                      </div>

                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={startQrLogin}
                          disabled={qrLoading}
                          className="flex-1 py-2.5 bg-[#171724] hover:bg-[#202030] text-gray-300 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? 'animate-spin' : ''}`} />
                          Обновить QR
                        </button>
                        <button
                          type="button"
                          onClick={handleSwitchToPhone}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          Вход по телефону <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: По номеру телефона */}
                  {mode === "phone" && step === "phone" && (
                    <form onSubmit={(e) => handleSendCode(e, false)}>
                      {(() => {
                        const detected = detectCountryByPhone(phoneNumber);
                        return (
                          <div className="mb-3 relative flex items-center">
                            <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none select-none z-10">
                              <span className="text-xl leading-none" title={detected.name}>
                                {detected.flag}
                              </span>
                              {detected.code !== "UN" && (
                                <span className="text-[11px] font-semibold text-gray-400 font-mono">
                                  {detected.dialCode}
                                </span>
                              )}
                            </div>
                            <input
                              type="tel"
                              placeholder="+7 999 123-45-67"
                              value={phoneNumber}
                              onChange={(e) => handlePhoneInputChange(e.target.value)}
                              className={`w-full bg-[#12121a] border border-[#20202e] rounded-2xl py-3 pr-4 text-gray-200 text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 transition-all font-mono ${
                                detected.code !== "UN" ? "pl-20" : "pl-12"
                              }`}
                            />
                          </div>
                        );
                      })()}

                      <div className="bg-[#12121c] border border-white/5 rounded-2xl p-3 mb-4 text-[11px] text-gray-400 space-y-1">
                        <p className="text-gray-300 font-medium flex items-center gap-1">
                          ℹ️ Важно о кодах Telegram:
                        </p>
                        <p>
                          Telegram отправляет код <b>в официальное приложение</b> на телефоне или ПК (в чат со служебными уведомлениями), если у вас есть активный сеанс.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !phoneNumber.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 text-sm"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Получить код"}
                      </button>

                      <div className="mt-4 pt-3 border-t border-white/5 text-center">
                        <button
                          type="button"
                          onClick={handleSwitchToQr}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Не хотите ждать код? Войдите по QR-коду
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Mode 2 Step: Ввод кода */}
                  {mode === "phone" && step === "code" && (
                    <form onSubmit={handleSignIn}>
                      {/* Notice where the code is sent */}
                      <div className={`p-3.5 rounded-2xl mb-4 border text-xs leading-relaxed ${
                        isCodeViaApp 
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                      }`}>
                        <div className="font-semibold flex items-center gap-1.5 mb-1 text-white">
                          <Smartphone className="w-4 h-4 text-blue-400" />
                          {isCodeViaApp 
                            ? "Код отправлен в приложение Telegram!" 
                            : "Код отправлен по SMS!"}
                        </div>
                        {isCodeViaApp ? (
                          <p className="text-blue-200/90 text-[11px]">
                            Откройте <b>Telegram</b> на телефоне или ПК: код находится в чате <b>«Служебные уведомления»</b> (от Telegram с синей галочкой).
                          </p>
                        ) : (
                          <p className="text-amber-200/90 text-[11px]">
                            Проверьте входящие SMS-сообщения на номере {phoneNumber}.
                          </p>
                        )}
                      </div>

                      <div className="mb-4 relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="•••••"
                          maxLength={6}
                          value={phoneCode}
                          onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                          className="w-full bg-[#12121a] border border-[#20202e] rounded-2xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 text-center tracking-[0.3em] font-mono text-xl"
                        />
                      </div>

                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setStep("phone")}
                          className="px-4 py-3 bg-[#171724] hover:bg-[#202030] text-gray-400 hover:text-white rounded-2xl text-xs font-medium cursor-pointer transition-colors"
                        >
                          Изменить номер
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !phoneCode.trim()}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 text-sm"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Подтвердить"}
                        </button>
                      </div>

                      {/* Not received code? Resend SMS / Switch to QR */}
                      <div className="bg-[#12121c] border border-white/5 rounded-2xl p-3 text-center space-y-2">
                        <p className="text-[11px] text-gray-400">Не пришел код в приложение?</p>
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            disabled={countdown > 0 || resending}
                            onClick={handleResendSMS}
                            className={`w-full py-2 rounded-xl text-xs font-medium transition-all ${
                              countdown > 0 || resending
                                ? "bg-white/5 text-gray-500 cursor-not-allowed"
                                : "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 cursor-pointer border border-indigo-500/30"
                            }`}
                          >
                            {resending ? (
                              <span className="flex items-center justify-center gap-1.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Отправка SMS...
                              </span>
                            ) : countdown > 0 ? (
                              `Отправить через SMS (через ${countdown}с)`
                            ) : (
                              "📩 Запросить код по SMS"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={handleSwitchToQr}
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors cursor-pointer py-1"
                          >
                            Или войти мгновенно по QR-коду без ожидания кода
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Mode 2 Step: 2FA Password */}
                  {mode === "phone" && step === "2fa" && (
                    <form onSubmit={handle2FASignIn}>
                      <div className="p-3 rounded-2xl mb-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                        <div>
                          <p className="font-semibold text-white mb-0.5">Включена двухфакторная аутентификация (2FA)</p>
                          <p className="text-gray-300 text-[11px]">
                            {twoFactorHint ? `Подсказка к паролю: «${twoFactorHint}»` : "Введите облачный пароль от вашей учетной записи."}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Облачный пароль"
                          value={twoFactorPassword}
                          onChange={(e) => setTwoFactorPassword(e.target.value)}
                          className="w-full bg-[#12121a] border border-[#20202e] rounded-2xl py-3 pl-11 pr-11 text-white focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setStep("code")}
                          className="px-4 py-3 bg-[#171724] hover:bg-[#202030] text-gray-400 rounded-2xl text-xs font-medium cursor-pointer"
                        >
                          Назад
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !twoFactorPassword.trim()}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 text-sm"
                        >
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти в аккаунт"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Mode 3: Строка сессии */}
                  {mode === "session" && (
                    <form onSubmit={handleRestoreCustomSession}>
                      <div className="mb-3 relative">
                        <textarea
                          placeholder="Вставьте сохраненную строку сессии (1BVts...)"
                          rows={4}
                          value={sessionInput}
                          onChange={(e) => setSessionInput(e.target.value)}
                          className="w-full bg-[#12121a] border border-[#20202e] rounded-2xl p-3.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/60 font-mono resize-none leading-relaxed"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mb-4 bg-[#12121c] p-2.5 rounded-xl border border-white/5">
                        💡 Если вы ранее авторизовались и скопировали строку сессии в профиле, вставьте её сюда для мгновенного входа без кодов и СМС.
                      </p>
                      <button
                        type="submit"
                        disabled={isLoading || !sessionInput.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 text-sm"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Восстановить сессию"}
                      </button>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
