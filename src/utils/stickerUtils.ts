export const getRecentStickers = async () => {
    // We'll call the backend API
    const res = await fetch("/api/telegram/stickers");
    return await res.json();
};
