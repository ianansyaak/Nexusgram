export interface Message {
  id: string;
  text: string;
  role: 'user' | 'model';
  timestamp: Date;
  media?: boolean;
  chatId?: string;
  senderId?: string;
  senderName?: string;
  mediaType?: string;
  mimeType?: string;
  reactions?: { emoticon: string, count: number, chosenOrder?: number | null }[];
  edited?: boolean;
  replyToMsgId?: number;
  replyToMsgText?: string;
  replyToSender?: string;
  isEncrypted?: boolean;
  views?: number;
  forwards?: number;
  read?: boolean;
  readAt?: number | Date;
  voiceNote?: boolean;
  videoNote?: boolean;
  isDeleted?: boolean;
  deletedAt?: number;
  replyMarkup?: {
    className: string;
    rows?: {
      buttons: {
        className: string;
        text: string;
        data?: string;
        url?: string;
        query?: string;
      }[];
    }[];
  };
  groupedItems?: Message[];
  fwdFrom?: { name: string, peerId?: string, msgId?: number };
  replies?: { replies: number; channelId?: string };
  repliesCount?: number;
  isSticker?: boolean;
  isAnimatedSticker?: boolean;
  stickerEmoji?: string;
}
