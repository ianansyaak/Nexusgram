/**
 * Nexus Blockchain Vault & End-to-End Cryptographic Ledger
 * 
 * Features:
 * - 256-bit AES-GCM Authenticated Encryption with unique 12-byte IV per message
 * - SHA-256 Cryptographic Blockchain Chaining (Genesis Block -> Block #1 -> Block #N)
 * - Stealth Carrier Format: in official Telegram clients, it appears as an innocent
 *   binary file attachment ("nexus_vault_block.bin"). In Nexusgram, it seamlessly
 *   decrypts and displays as native text, photos, video, audio/voice, or stickers.
 * - Real-time Live Keystrokes (Telepathic typing stream)
 * - Master Private Key management, export/import, and validation
 */

export interface NexusBlockData {
  index: number;
  timestamp: number;
  prevHash: string;
  hash: string;
  nonce: number;
  senderAddress: string;
  chatId: string;
  payloadHash: string;
  encryptedData: string; // Base64 encoded payload
  iv: string; // Base64 12-byte IV for AES-256-GCM
  signature: string;
  authTag?: string;
}

export interface DecryptedMessagePayload {
  version?: "1.0";
  type: "text" | "photo" | "video" | "audio" | "voice" | "sticker" | "file";
  text?: string;
  mediaBase64?: string;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  stickerEmoji?: string;
  isAnimatedSticker?: boolean;
  replyToMsgId?: string | number;
  originalDate?: number;
  senderId?: string;
  senderName?: string;
}

// Default user master key (can be customized or regenerated)
export const DEFAULT_USER_MASTER_KEY = "NXK-VAULT-7A9F-B48E-2C1D-894E-601F-B37D-92CE-5A81-4F20";

const STORAGE_MASTER_KEY = "nexus_master_key";
const STORAGE_BLOCKCHAIN_ENABLED = "nexus_blockchain_encryption";
const STORAGE_LIVE_KEYSTROKES_ENABLED = "nexus_live_keystrokes_enabled";
const STORAGE_LEDGER = "nexus_blockchain_ledger_v1";
const STORAGE_NEXUS_USERS = "nexus_known_clients_v1";

// In-memory cache for decrypted messages so we don't re-decrypt on every re-render
const decryptedCache = new Map<string, { payload: DecryptedMessagePayload; block: NexusBlockData; isValid: boolean }>();

/**
 * Get current Master Key from persistent storage or default
 */
export function getMasterKey(): string {
  if (typeof window === "undefined") return DEFAULT_USER_MASTER_KEY;
  let key = localStorage.getItem(STORAGE_MASTER_KEY);
  if (!key || !key.trim()) {
    key = DEFAULT_USER_MASTER_KEY;
    localStorage.setItem(STORAGE_MASTER_KEY, key);
  }
  return key.trim();
}

/**
 * Update the user's Master Key
 */
export function setMasterKey(key: string): void {
  if (typeof window === "undefined") return;
  const cleaned = key.trim();
  localStorage.setItem(STORAGE_MASTER_KEY, cleaned);
  decryptedCache.clear();
  window.dispatchEvent(new CustomEvent("nexus-key-updated", { detail: { key: cleaned } }));
}

/**
 * Generate a new cryptographically strong Master Key
 */
export function generateNewMasterKey(): string {
  const chars = "0123456789ABCDEF";
  const segments: string[] = [];
  const bytes = new Uint8Array(24);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < 6; i++) {
      let seg = "";
      for (let j = 0; j < 4; j++) {
        seg += chars[bytes[i * 4 + j] % chars.length];
      }
      segments.push(seg);
    }
  } else {
    for (let i = 0; i < 6; i++) {
      let seg = "";
      for (let j = 0; j < 4; j++) {
        seg += chars[Math.floor(Math.random() * chars.length)];
      }
      segments.push(seg);
    }
  }
  return `NXK-VAULT-${segments.join("-")}`;
}

/**
 * Check if Blockchain Encryption is enabled globally
 */
export function isBlockchainEncryptionEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_BLOCKCHAIN_ENABLED) !== "false";
}

/**
 * Set Blockchain Encryption toggle state
 */
export function setBlockchainEncryptionEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_BLOCKCHAIN_ENABLED, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("nexus-encryption-toggle", { detail: { enabled } }));
}

/**
 * Check if Live Keystrokes (real-time typing broadcast & peeking) is enabled
 */
export function isLiveKeystrokesEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_LIVE_KEYSTROKES_ENABLED) !== "false";
}

/**
 * Set Live Keystrokes toggle state
 */
export function setLiveKeystrokesEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_LIVE_KEYSTROKES_ENABLED, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("nexus-keystrokes-toggle", { detail: { enabled } }));
}

/**
 * Derive AES-256-GCM CryptoKey from string master key using SHA-256
 */
async function deriveCryptoKey(keyString: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawBytes = enc.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", rawBytes);
  return await crypto.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Compute SHA-256 hex string
 */
export async function sha256Hex(content: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * ArrayBuffer / Uint8Array to Base64
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Get local blockchain ledger
 */
export function getBlockchainLedger(): NexusBlockData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_LEDGER);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save block to local blockchain ledger
 */
export function recordBlockToLedger(block: NexusBlockData): void {
  if (typeof window === "undefined") return;
  try {
    const ledger = getBlockchainLedger();
    if (!ledger.some((b) => b.hash === block.hash || (b.index === block.index && b.index > 0))) {
      ledger.push(block);
      // Keep last 500 blocks locally for performance
      const trimmed = ledger.slice(-500);
      localStorage.setItem(STORAGE_LEDGER, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent("nexus-ledger-updated", { detail: { block } }));
    }
  } catch (e) {
    console.warn("Failed to record block to ledger:", e);
  }
}

/**
 * Validate cryptographic integrity of entire blockchain
 */
export async function validateChainIntegrity(): Promise<{
  isValid: boolean;
  totalBlocks: number;
  lastBlockHash: string;
  errors: string[];
}> {
  const ledger = getBlockchainLedger();
  const errors: string[] = [];

  if (ledger.length === 0) {
    return { isValid: true, totalBlocks: 0, lastBlockHash: "GENESIS_NOT_CREATED", errors: [] };
  }

  for (let i = 0; i < ledger.length; i++) {
    const block = ledger[i];
    const expectedHashString = `${block.index}|${block.prevHash}|${block.timestamp}|${block.payloadHash}|${block.nonce}|${block.senderAddress}|${block.chatId}`;
    const calculatedHash = await sha256Hex(expectedHashString);

    if (calculatedHash !== block.hash) {
      errors.push(`Block #${block.index} hash mismatch (Calculated: ${calculatedHash.slice(0, 8)}..., Recorded: ${block.hash.slice(0, 8)}...)`);
    }

    if (i > 0) {
      const prevBlock = ledger[i - 1];
      if (block.prevHash !== prevBlock.hash) {
        errors.push(`Block #${block.index} prevHash link broken`);
      }
      if (block.index !== prevBlock.index + 1) {
        errors.push(`Block #${block.index} non-sequential index`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    totalBlocks: ledger.length,
    lastBlockHash: ledger[ledger.length - 1]?.hash || "N/A",
    errors,
  };
}

/**
 * Encrypt a message payload and seal it into a verifiable Blockchain Block
 * Returns a binary File ready to be sent through Telegram as an ordinary file
 */
export async function encryptAndCreateBlockFile(
  payload: DecryptedMessagePayload,
  chatId: string,
  senderAddress: string = "NexusUser"
): Promise<{ file: File; block: NexusBlockData }> {
  const masterKeyStr = getMasterKey();
  const cryptoKey = await deriveCryptoKey(masterKeyStr);

  // 1. Generate 12-byte random IV
  const ivBytes = new Uint8Array(12);
  crypto.getRandomValues(ivBytes);

  // 2. Encrypt serialized payload using AES-GCM
  const enc = new TextEncoder();
  const payloadBytes = enc.encode(JSON.stringify(payload));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    cryptoKey,
    payloadBytes
  );

  const encryptedDataBase64 = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(ivBytes);

  // 3. Compute payload hash
  const payloadHash = await sha256Hex(encryptedDataBase64);

  // 4. Read previous block to link chain
  const ledger = getBlockchainLedger();
  const lastBlock = ledger.length > 0 ? ledger[ledger.length - 1] : null;
  const index = lastBlock ? lastBlock.index + 1 : 1;
  const prevHash = lastBlock ? lastBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000";
  const timestamp = Date.now();
  const nonce = Math.floor(Math.random() * 10000000);

  // 5. Compute cryptographic block hash
  const hashString = `${index}|${prevHash}|${timestamp}|${payloadHash}|${nonce}|${senderAddress}|${chatId}`;
  const blockHash = await sha256Hex(hashString);
  const signature = await sha256Hex(`${blockHash}|${masterKeyStr.slice(0, 16)}`);

  const block: NexusBlockData = {
    index,
    timestamp,
    prevHash,
    hash: blockHash,
    nonce,
    senderAddress,
    chatId,
    payloadHash,
    encryptedData: encryptedDataBase64,
    iv: ivBase64,
    signature,
  };

  // Record to local ledger
  recordBlockToLedger(block);

  // 6. Assemble the Stealth Telegram carrier binary
  // Format:
  // NXBLKC1\n
  // {Block Metadata JSON}\n
  // ---NX-PAYLOAD-START---\n
  // {Encrypted Data Base64}\n
  // ---NX-PAYLOAD-END---
  const blockMetaHeader = JSON.stringify({
    v: "NXBLKC1",
    index: block.index,
    timestamp: block.timestamp,
    prevHash: block.prevHash,
    hash: block.hash,
    nonce: block.nonce,
    sender: block.senderAddress,
    chatId: block.chatId,
    iv: block.iv,
    payloadHash: block.payloadHash,
    signature: block.signature,
  });

  const fileContent = `NXBLKC1\n${blockMetaHeader}\n---NX-PAYLOAD-START---\n${encryptedDataBase64}\n---NX-PAYLOAD-END---`;
  const blob = new Blob([fileContent], { type: "application/octet-stream" });
  
  // Filename as an ordinary innocuous file for official Telegram
  const fileName = "nexus_vault_block.bin";
  const file = new File([blob], fileName, { type: "application/octet-stream" });

  return { file, block };
}

export const NEXUS_ZERO_WIDTH_CODE = "\u200B\u2060\u200D";
export const NEXUS_TEXT_PREFIX = "🔒 NX1:";

/**
 * Fast background encryption for text messages without sending any file attachment
 */
export async function encryptNexusTextMessage(
  text: string,
  chatId: string = "current",
  senderAddress: string = "NexusUser"
): Promise<{ encryptedText: string; block: NexusBlockData }> {
  const masterKeyStr = getMasterKey();
  const cryptoKey = await deriveCryptoKey(masterKeyStr);

  const payload: DecryptedMessagePayload = {
    type: "text",
    text,
  };
  const jsonStr = JSON.stringify(payload);
  const plainBytes = new TextEncoder().encode(jsonStr);

  // Generate 12-byte IV for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    plainBytes
  );

  const encryptedDataBase64 = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(iv);
  const payloadHash = await sha256Hex(jsonStr);

  // Block creation
  const ledger = getBlockchainLedger();
  const prevBlock = ledger[ledger.length - 1];
  const prevHash = prevBlock ? prevBlock.hash : "0000000000000000000000000000000000000000000000000000000000000000";
  const index = ledger.length;
  const timestamp = Date.now();
  const nonce = Math.floor(Math.random() * 1000000);

  const hashString = `${index}|${prevHash}|${timestamp}|${payloadHash}|${nonce}|${senderAddress}|${chatId}`;
  const blockHash = await sha256Hex(hashString);
  const signature = await sha256Hex(`SIG:${masterKeyStr}:${blockHash}`);

  const block: NexusBlockData = {
    index,
    timestamp,
    prevHash,
    hash: blockHash,
    nonce,
    senderAddress,
    chatId,
    payloadHash,
    encryptedData: encryptedDataBase64,
    iv: ivBase64,
    signature,
  };

  recordBlockToLedger(block);

  // Compact armored string
  const envelope = JSON.stringify({
    idx: block.index,
    iv: block.iv,
    d: block.encryptedData,
    h: block.hash,
    t: block.timestamp,
    ph: block.payloadHash,
    sig: block.signature,
  });
  const armored = btoa(unescape(encodeURIComponent(envelope)));
  const encryptedText = `${NEXUS_TEXT_PREFIX}${armored}`;

  return { encryptedText, block };
}

/**
 * Fast background decryption for text messages
 */
export async function decryptNexusTextMessage(
  text: string
): Promise<{ text: string; block: NexusBlockData } | null> {
  try {
    if (!text) return null;
    let payloadStr = "";
    if (text.startsWith(NEXUS_TEXT_PREFIX)) {
      payloadStr = text.substring(NEXUS_TEXT_PREFIX.length).trim();
    } else if (text.startsWith("NX1:")) {
      payloadStr = text.substring(4).trim();
    } else {
      return null;
    }

    const envelopeJson = decodeURIComponent(escape(atob(payloadStr)));
    const env = JSON.parse(envelopeJson);

    const masterKeyStr = getMasterKey();
    const cryptoKey = await deriveCryptoKey(masterKeyStr);
    const ivBytes = base64ToBuffer(env.iv);
    const cipherBytes = base64ToBuffer(env.d);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      cryptoKey,
      cipherBytes
    );

    const decryptedJson = new TextDecoder("utf-8").decode(decryptedBuffer);
    const payload: DecryptedMessagePayload = JSON.parse(decryptedJson);

    const block: NexusBlockData = {
      index: env.idx || 0,
      timestamp: env.t || Date.now(),
      prevHash: "",
      hash: env.h || "",
      nonce: 0,
      senderAddress: "NexusUser",
      chatId: "current",
      payloadHash: env.ph || "",
      encryptedData: env.d,
      iv: env.iv,
      signature: env.sig || "",
    };

    recordBlockToLedger(block);

    return { text: payload.text || "", block };
  } catch (e) {
    return null;
  }
}

/**
 * Decrypt a raw binary or text container containing a Nexus Blockchain Block
 */
export async function decryptAndVerifyBlockData(
  rawData: string | ArrayBuffer
): Promise<{ block: NexusBlockData; payload: DecryptedMessagePayload; isValid: boolean }> {
  let content = "";
  if (typeof rawData === "string") {
    content = rawData;
  } else {
    content = new TextDecoder("utf-8").decode(rawData);
  }

  // Handle fast armored text block
  if (content.startsWith(NEXUS_TEXT_PREFIX) || content.startsWith("NX1:")) {
    const res = await decryptNexusTextMessage(content);
    if (res) {
      return {
        block: res.block,
        payload: { type: "text", text: res.text },
        isValid: true,
      };
    }
  }

  if (!content.includes("NXBLKC1")) {
    throw new Error("Not a valid Nexus Blockchain Block container");
  }

  const lines = content.split("\n");
  const metaJsonLine = lines[1] || "";
  const meta = JSON.parse(metaJsonLine);

  const startMarker = "---NX-PAYLOAD-START---";
  const endMarker = "---NX-PAYLOAD-END---";
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error("Corrupted Nexus Blockchain Block structure");
  }

  const encryptedBase64 = content.substring(startIndex + startMarker.length, endIndex).trim();

  // Rebuild block data
  const block: NexusBlockData = {
    index: meta.index,
    timestamp: meta.timestamp,
    prevHash: meta.prevHash,
    hash: meta.hash,
    nonce: meta.nonce,
    senderAddress: meta.sender,
    chatId: meta.chatId,
    payloadHash: meta.payloadHash,
    encryptedData: encryptedBase64,
    iv: meta.iv,
    signature: meta.signature,
  };

  // Verify hash
  const hashString = `${block.index}|${block.prevHash}|${block.timestamp}|${block.payloadHash}|${block.nonce}|${block.senderAddress}|${block.chatId}`;
  const computedHash = await sha256Hex(hashString);
  const isValid = computedHash === block.hash;

  // Decrypt AES-256-GCM
  const masterKeyStr = getMasterKey();
  const cryptoKey = await deriveCryptoKey(masterKeyStr);
  const ivBytes = base64ToBuffer(block.iv);
  const cipherBytes = base64ToBuffer(block.encryptedData);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    cryptoKey,
    cipherBytes
  );

  const decryptedJson = new TextDecoder("utf-8").decode(decryptedBuffer);
  const payload: DecryptedMessagePayload = JSON.parse(decryptedJson);

  // Record to local ledger if valid
  if (isValid) {
    recordBlockToLedger(block);
  }

  return { block, payload, isValid };
}

/**
 * Check if a given message is an encrypted Nexus Blockchain block
 */
export function isNexusBlockMessage(msg: {
  fileName?: string;
  text?: string;
  mimeType?: string;
  media?: boolean;
}): boolean {
  if (!msg) return false;
  if (msg.text && (msg.text.startsWith(NEXUS_TEXT_PREFIX) || msg.text.startsWith("NX1:") || msg.text.startsWith("NXBLKC1\n"))) return true;
  if (msg.fileName === "nexus_vault_block.bin" || msg.fileName?.includes("nexus_vault_block")) return true;
  if (msg.fileName?.endsWith(".bin") && msg.fileName?.startsWith("nexus_")) return true;
  return false;
}

/**
 * Cache decrypted message
 */
export function setCachedDecryptedMessage(
  msgId: string | number,
  payload: DecryptedMessagePayload,
  block: NexusBlockData,
  isValid: boolean = true
): void {
  decryptedCache.set(String(msgId), { payload, block, isValid });
}

/**
 * Retrieve cached decrypted message
 */
export function getCachedDecryptedMessage(
  msgId: string | number
): { payload: DecryptedMessagePayload; block: NexusBlockData; isValid: boolean } | null {
  return decryptedCache.get(String(msgId)) || null;
}

/**
 * Synchronize known Nexusgram clients with backend
 */
export async function syncNexusClientsWithServer(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/nexus/clients");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.clients)) {
        const raw = localStorage.getItem(STORAGE_NEXUS_USERS);
        const current: string[] = raw ? JSON.parse(raw) : [];
        const merged = Array.from(new Set([...current, ...data.clients.map((id: any) => String(id))]));
        localStorage.setItem(STORAGE_NEXUS_USERS, JSON.stringify(merged));
        merged.forEach((id) => {
          localStorage.setItem(`nexus_client_${id}`, "true");
        });
        window.dispatchEvent(new CustomEvent("nexus-users-updated", { detail: { clients: merged } }));
        return merged;
      }
    }
  } catch (e) {}
  return [];
}

// Auto sync on client boot
if (typeof window !== "undefined") {
  syncNexusClientsWithServer().catch(() => {});
}

/**
 * Check if a user/contact has Nexusgram client installed
 */
export function isUserNexusgramClient(userIdOrPeer: string): boolean {
  if (typeof window === "undefined" || !userIdOrPeer) return false;
  const idStr = String(userIdOrPeer);
  if (idStr === "undefined" || idStr === "null") return false;

  const myId = localStorage.getItem("telegram_my_id");
  if (idStr === "me" || (myId && idStr === String(myId))) return true;

  // Direct flag
  if (localStorage.getItem(`nexus_client_${idStr}`) === "true") return true;

  // Check local profile config
  try {
    const profRaw = localStorage.getItem(`local_profile_${idStr}`);
    if (profRaw) {
      const prof = JSON.parse(profRaw);
      if (prof.isNexusClient) return true;
    }
  } catch (e) {}

  // Check shared storage list
  try {
    const raw = localStorage.getItem(STORAGE_NEXUS_USERS);
    if (raw) {
      const list: string[] = JSON.parse(raw);
      if (list.includes(idStr)) return true;
    }
  } catch (e) {}

  return false;
}

/**
 * Register or unregister a user as having Nexusgram
 */
export function registerUserAsNexusgram(userIdOrPeer: string, isClient: boolean = true): void {
  if (typeof window === "undefined" || !userIdOrPeer) return;
  const id = String(userIdOrPeer);
  if (id === "undefined" || id === "null") return;

  try {
    const raw = localStorage.getItem(STORAGE_NEXUS_USERS);
    let list: string[] = raw ? JSON.parse(raw) : [];

    if (isClient) {
      if (!list.includes(id)) {
        list.push(id);
      }
      localStorage.setItem(`nexus_client_${id}`, "true");
    } else {
      list = list.filter((item) => item !== id);
      localStorage.removeItem(`nexus_client_${id}`);
    }

    localStorage.setItem(STORAGE_NEXUS_USERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("nexus-users-updated", { detail: { userId: id, isClient } }));

    // Sync to server in background
    fetch("/api/nexus/mark-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: id, isClient }),
    }).catch(() => {});
  } catch (e) {}
}

// ==========================================
// Compatibility Aliases & Conversion Helpers
// ==========================================

export const getMasterEncryptionKey = getMasterKey;
export const setMasterEncryptionKey = setMasterKey;
export const generateRandomMasterKey = generateNewMasterKey;
export const getLocalBlockchain = getBlockchainLedger;
export const validateBlockchainIntegrity = validateChainIntegrity;
export const isLiveKeystrokesViewEnabled = isLiveKeystrokesEnabled;
export const setLiveKeystrokesViewEnabled = setLiveKeystrokesEnabled;
export const saveNexusBlockLocally = recordBlockToLedger;

/**
 * Export full blockchain ledger as formatted JSON string
 */
export function exportBlockchainJson(): string {
  return JSON.stringify(getBlockchainLedger(), null, 2);
}

/**
 * Import a blockchain ledger from JSON string
 */
export function importBlockchainJson(jsonStr: string): { success: boolean; imported?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_LEDGER, JSON.stringify(parsed));
      window.dispatchEvent(new CustomEvent("nexus-ledger-updated", { detail: {} }));
      return { success: true, imported: parsed.length };
    }
    return { success: false, error: "Invalid ledger structure (must be an array of blocks)" };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to parse JSON" };
  }
}

/**
 * Convert File to Base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert Blob to Base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

/**
 * Create a binary-sealed Nexus Blockchain block ready to upload
 */
export async function createNexusEncryptedBlock(
  payload: DecryptedMessagePayload,
  chatId: string = "current",
  senderAddress: string = "NexusUser"
): Promise<{ file: File; block: NexusBlockData; binaryBytes: Uint8Array }> {
  const result = await encryptAndCreateBlockFile(payload, chatId, senderAddress);
  const arrayBuffer = await result.file.arrayBuffer();
  return {
    file: result.file,
    block: result.block,
    binaryBytes: new Uint8Array(arrayBuffer),
  };
}
