import { useState, useEffect } from "react";

// Multilingual support for NexusGram
export type LanguageCode = "ru" | "en" | "es";

export interface I18nStrings {
  settingsTitle: string;
  settingsSubtitle: string;
  tabTelemetry: string;
  tabGeneral: string;
  tabPermissions: string;
  tabPlugins: string;
  tabIphone: string;
  close: string;
  save: string;
  delete: string;
  edit: string;
  reply: string;
  pin: string;
  unpin: string;
  mute: string;
  unmute: string;
  archive: string;
  unarchive: string;
  copy: string;
  select: string;
  translate: string;
  original: string;
  translating: string;
  speed: string;
  ping: string;
  battery: string;
  theme: string;
  language: string;
  themeDark: string;
  themeLight: string;
  themeSystem: string;
  trafficRx: string;
  trafficTx: string;
  trafficTotal: string;
  gallery: string;
  dragDropHere: string;
  islandSettings: string;
  testPlugin: string;
  
  // Tabs & categories
  categoryAll: string;
  categoryAlbums: string;
  categoryNotes: string;
  categoryPersonal: string;
  categoryGroups: string;
  categoryChannels: string;
  categoryBots: string;
  categoryForums: string;
  
  // Notes feature
  notesTitle: string;
  newNote: string;
  createNote: string;
  emptyNotes: string;
  noteTitlePlaceholder: string;
  noteContentPlaceholder: string;
  addPhoto: string;
  noteSaved: string;
  noteSaving: string;
  deleteNoteConfirm: string;
  notesFileSaved: string;
  
  // Chat & Messages
  searchPlaceholder: string;
  messagePlaceholder: string;
  typing: string;
  userTyping: string;
  online: string;
  offline: string;
  lastSeenRecently: string;
  members: string;
  subscribers: string;
  encryptionOn: string;
  encryptionOff: string;
  pinnedMessage: string;
  stickersAndEmoji: string;
  back: string;
  deleteForEveryone: string;
  deleteForMe: string;
  clientNexusgram: string;
  
  searchGlobally: string;
  noGlobalResults: string;
  noAlbumsFound: string;
  createOrManageAlbums: string;
  chatsGrouped: string;
  album: string;
  aiAssistant: string;
  aiAssistantSubtitle: string;
  aiPromptPlaceholder: string;
  pinned: string;
  clientBadge: string;
  verified: string;
  scam: string;
  fake: string;
  bot: string;
  profile: string;
  savedMessages: string;
  draft: string;
  archiveEmpty: string;
  archiveEmptyDesc: string;
}

const translations: Record<LanguageCode, I18nStrings> = {
  ru: {
    settingsTitle: "Настройки и Телеметрия",
    settingsSubtitle: "Технические данные, сотовая сеть, трафик и плагины Ayugram",
    tabTelemetry: "Телеметрия & Сеть",
    tabGeneral: "Общие & Обложка",
    tabPermissions: "Датчики & Права",
    tabPlugins: "Плагины Ayugram",
    tabIphone: "PWA & Dynamic Island",
    close: "Закрыть",
    save: "Сохранить",
    delete: "Удалить",
    edit: "Изменить",
    reply: "Ответить",
    pin: "Закрепить",
    unpin: "Открепить",
    mute: "Без звука",
    unmute: "Включить звук",
    archive: "В архив",
    unarchive: "Из архива",
    copy: "Копировать",
    select: "Выбрать",
    translate: "Перевести",
    original: "Оригинал",
    translating: "Перевод на выбранный язык...",
    speed: "Скорость",
    ping: "Пинг",
    battery: "Заряд батареи",
    theme: "Тема оформления",
    language: "Язык интерфейса",
    themeDark: "Тёмная",
    themeLight: "Светлая",
    themeSystem: "Системная",
    trafficRx: "Входящий",
    trafficTx: "Исходящий",
    trafficTotal: "Всего трафика",
    gallery: "Галерея",
    dragDropHere: "Перетащите файлы сюда для быстрой отправки",
    islandSettings: "Что показывать на Dynamic Island",
    testPlugin: "Тестировать плагин",
    
    categoryAll: "Все",
    categoryAlbums: "Альбомы",
    categoryNotes: "Заметки",
    categoryPersonal: "Личные",
    categoryGroups: "Группы",
    categoryChannels: "Каналы",
    categoryBots: "Боты",
    categoryForums: "Форумы",
    
    notesTitle: "Заметки",
    newNote: "Новая заметка",
    createNote: "Создать заметку",
    emptyNotes: "У вас пока нет заметок. Нажмите +, чтобы создать первую заметку.",
    noteTitlePlaceholder: "Заголовок заметки...",
    noteContentPlaceholder: "Начните писать здесь или вставьте изображение...",
    addPhoto: "Добавить фото",
    noteSaved: "Сохранено на сервере",
    noteSaving: "Сохранение...",
    deleteNoteConfirm: "Удалить эту заметку?",
    notesFileSaved: "Сохранено в файл пользователя",
    
    searchPlaceholder: "Поиск чатов и сообщений...",
    messagePlaceholder: "Сообщение в Telegram...",
    typing: "печатает...",
    userTyping: "печатает сообщение...",
    online: "в сети",
    offline: "не в сети",
    lastSeenRecently: "был(а) недавно",
    members: "участников",
    subscribers: "подписчиков",
    encryptionOn: "Шифрование Nexus Vault включено",
    encryptionOff: "Включить сквозное шифрование",
    pinnedMessage: "Закрепленное сообщение",
    stickersAndEmoji: "Стикеры и эмодзи",
    back: "Назад",
    deleteForEveryone: "Удалить для всех",
    deleteForMe: "Удалить только у меня",
    clientNexusgram: "Клиент: Nexusgram ⚡",
    
    searchGlobally: "Искать глобально",
    noGlobalResults: "Глобальных результатов не найдено",
    noAlbumsFound: "Папок пока нет. Создайте первую папку с помощью кнопки выше!",
    createOrManageAlbums: "Создать или настроить альбомы",
    chatsGrouped: "чатов в альбоме",
    album: "Альбом",
    aiAssistant: "AI Ассистент",
    aiAssistantSubtitle: "Умный помощник Gemini AI",
    aiPromptPlaceholder: "Спросите что-нибудь у AI...",
    pinned: "Закреплено",
    clientBadge: "Nexus",
    verified: "Подтвержден",
    scam: "СКАМ",
    fake: "ФЕЙК",
    bot: "БОТ",
    profile: "Профиль",
    savedMessages: "Избранное",
    draft: "Черновик",
    archiveEmpty: "В архиве пока пусто",
    archiveEmptyDesc: "Здесь будут отображаться заархивированные чаты"
  },
  en: {
    settingsTitle: "Settings & Telemetry",
    settingsSubtitle: "Hardware metrics, cellular network, traffic and Ayugram plugins",
    tabTelemetry: "Telemetry & Network",
    tabGeneral: "General & Cover",
    tabPermissions: "Sensors & Access",
    tabPlugins: "Ayugram Plugins",
    tabIphone: "PWA & Dynamic Island",
    close: "Close",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    reply: "Reply",
    pin: "Pin",
    unpin: "Unpin",
    mute: "Mute",
    unmute: "Unmute",
    archive: "Archive",
    unarchive: "Unarchive",
    copy: "Copy",
    select: "Select",
    translate: "Translate",
    original: "Original",
    translating: "Translating to selected language...",
    speed: "Speed",
    ping: "Ping",
    battery: "Battery Level",
    theme: "Theme",
    language: "Language",
    themeDark: "Dark",
    themeLight: "Light",
    themeSystem: "System",
    trafficRx: "Downloaded",
    trafficTx: "Uploaded",
    trafficTotal: "Total Traffic",
    gallery: "Gallery",
    dragDropHere: "Drop files here for instant upload",
    islandSettings: "What to show on Dynamic Island",
    testPlugin: "Test Plugin",
    
    categoryAll: "All",
    categoryAlbums: "Albums",
    categoryNotes: "Notes",
    categoryPersonal: "Personal",
    categoryGroups: "Groups",
    categoryChannels: "Channels",
    categoryBots: "Bots",
    categoryForums: "Forums",
    
    notesTitle: "Notes",
    newNote: "New Note",
    createNote: "Create Note",
    emptyNotes: "No notes yet. Tap + to create your first note.",
    noteTitlePlaceholder: "Note title...",
    noteContentPlaceholder: "Start typing here or paste an image...",
    addPhoto: "Add Photo",
    noteSaved: "Saved to server file",
    noteSaving: "Saving...",
    deleteNoteConfirm: "Delete this note?",
    notesFileSaved: "Saved to persistent user storage",
    
    searchPlaceholder: "Search chats and messages...",
    messagePlaceholder: "Message via Telegram...",
    typing: "typing...",
    userTyping: "is typing...",
    online: "online",
    offline: "offline",
    lastSeenRecently: "last seen recently",
    members: "members",
    subscribers: "subscribers",
    encryptionOn: "Nexus Vault encryption active",
    encryptionOff: "Enable end-to-end encryption",
    pinnedMessage: "Pinned Message",
    stickersAndEmoji: "Stickers & Emoji",
    back: "Back",
    deleteForEveryone: "Delete for everyone",
    deleteForMe: "Delete for me",
    clientNexusgram: "Client: Nexusgram ⚡",
    
    searchGlobally: "Search Globally",
    noGlobalResults: "No global results found.",
    noAlbumsFound: "No custom albums found. Create your first folder using the button above!",
    createOrManageAlbums: "Create or Manage Albums",
    chatsGrouped: "chats grouped",
    album: "Album",
    aiAssistant: "AI Assistant",
    aiAssistantSubtitle: "Gemini AI intelligent assistant",
    aiPromptPlaceholder: "Ask AI anything...",
    pinned: "Pinned",
    clientBadge: "Nexus",
    verified: "Verified",
    scam: "SCAM",
    fake: "FAKE",
    bot: "BOT",
    profile: "Profile",
    savedMessages: "Saved Messages",
    draft: "Draft",
    archiveEmpty: "Archive is empty",
    archiveEmptyDesc: "Archived chats will appear here"
  },
  es: {
    settingsTitle: "Ajustes y Telemetría",
    settingsSubtitle: "Métricas de hardware, red móvil, tráfico y plugins de Ayugram",
    tabTelemetry: "Telemetría y Red",
    tabGeneral: "General y Portada",
    tabPermissions: "Sensores y Permisos",
    tabPlugins: "Plugins Ayugram",
    tabIphone: "PWA y Dynamic Island",
    close: "Cerrar",
    save: "Guardar",
    delete: "Eliminar",
    edit: "Editar",
    reply: "Responder",
    pin: "Fijar",
    unpin: "Desfijar",
    mute: "Silenciar",
    unmute: "Reactivar",
    archive: "Archivar",
    unarchive: "Desarchivar",
    copy: "Copiar",
    select: "Seleccionar",
    translate: "Traducir",
    original: "Original",
    translating: "Traduciendo al idioma seleccionado...",
    speed: "Velocidad",
    ping: "Ping",
    battery: "Batería",
    theme: "Tema",
    language: "Idioma",
    themeDark: "Oscuro",
    themeLight: "Claro",
    themeSystem: "Sistema",
    trafficRx: "Recibido",
    trafficTx: "Enviado",
    trafficTotal: "Tráfico total",
    gallery: "Galería",
    dragDropHere: "Arrastra archivos aquí para enviar",
    islandSettings: "Qué mostrar en Dynamic Island",
    testPlugin: "Probar Plugin",
    
    categoryAll: "Todos",
    categoryAlbums: "Álbumes",
    categoryNotes: "Notas",
    categoryPersonal: "Personal",
    categoryGroups: "Grupos",
    categoryChannels: "Canales",
    categoryBots: "Bots",
    categoryForums: "Foros",
    
    notesTitle: "Notas",
    newNote: "Nueva Nota",
    createNote: "Crear Nota",
    emptyNotes: "No hay notas aún. Pulsa + para crear la primera nota.",
    noteTitlePlaceholder: "Título de la nota...",
    noteContentPlaceholder: "Comienza a escribir aquí o pega una imagen...",
    addPhoto: "Añadir foto",
    noteSaved: "Guardado en el servidor",
    noteSaving: "Guardando...",
    deleteNoteConfirm: "¿Eliminar esta nota?",
    notesFileSaved: "Guardado en el archivo del usuario",
    
    searchPlaceholder: "Buscar chats y mensajes...",
    messagePlaceholder: "Mensaje por Telegram...",
    typing: "escribiendo...",
    userTyping: "está escribiendo...",
    online: "en línea",
    offline: "desconectado",
    lastSeenRecently: "última vez recientemente",
    members: "miembros",
    subscribers: "suscriptores",
    encryptionOn: "Cifrado Nexus Vault activo",
    encryptionOff: "Activar cifrado de extremo a extremo",
    pinnedMessage: "Mensaje fijado",
    stickersAndEmoji: "Stickers y Emoji",
    back: "Atrás",
    deleteForEveryone: "Eliminar para todos",
    deleteForMe: "Eliminar para mí",
    clientNexusgram: "Cliente: Nexusgram ⚡",
    
    searchGlobally: "Buscar globalmente",
    noGlobalResults: "No se encontraron resultados globales",
    noAlbumsFound: "No hay álbumes aún. ¡Crea tu primera carpeta con el botón de arriba!",
    createOrManageAlbums: "Crear o gestionar álbumes",
    chatsGrouped: "chats agrupados",
    album: "Álbum",
    aiAssistant: "Asistente AI",
    aiAssistantSubtitle: "Asistente inteligente Gemini AI",
    aiPromptPlaceholder: "Pregúntale algo a la IA...",
    pinned: "Fijado",
    clientBadge: "Nexus",
    verified: "Verificado",
    scam: "ESTAFA",
    fake: "FALSO",
    bot: "BOT",
    profile: "Perfil",
    savedMessages: "Mensajes guardados",
    draft: "Borrador",
    archiveEmpty: "El archivo está vacío",
    archiveEmptyDesc: "Los chats archivados aparecerán aquí"
  }
};

export function getCurrentLanguage(): LanguageCode {
  if (typeof localStorage === "undefined") return "ru";
  const stored = localStorage.getItem("nexus_lang");
  if (stored === "en" || stored === "es" || stored === "ru") return stored;
  return "ru";
}

export function setAppLanguage(lang: LanguageCode): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem("nexus_lang", lang);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("languagechange"));
  }
}

export function getStrings(lang?: string): I18nStrings {
  const code = (lang || getCurrentLanguage()) as LanguageCode;
  return translations[code] || translations.ru;
}

export function useI18n(): { strings: I18nStrings; language: LanguageCode; setLanguage: (l: LanguageCode) => void } {
  const [lang, setLangState] = useState<LanguageCode>(getCurrentLanguage);

  useEffect(() => {
    const onLangChange = () => {
      setLangState(getCurrentLanguage());
    };
    window.addEventListener("languagechange", onLangChange);
    window.addEventListener("storage", onLangChange);
    return () => {
      window.removeEventListener("languagechange", onLangChange);
      window.removeEventListener("storage", onLangChange);
    };
  }, []);

  const changeLanguage = (newLang: LanguageCode) => {
    setAppLanguage(newLang);
    setLangState(newLang);
  };

  return {
    strings: translations[lang] || translations.ru,
    language: lang,
    setLanguage: changeLanguage
  };
}

export function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    root.classList.remove("light-theme");
    root.classList.add("dark-theme");
    document.body.style.backgroundColor = "#0e1621";
    document.body.style.color = "#f3f4f6";
  } else {
    root.classList.remove("dark-theme");
    root.classList.add("light-theme");
    document.body.style.backgroundColor = "#f0f2f5";
    document.body.style.color = "#111827";
  }

  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", isDark ? "#0e1621" : "#ffffff");
  }
}
