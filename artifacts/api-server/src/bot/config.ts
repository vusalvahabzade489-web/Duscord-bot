export const TICKET_CATEGORY_NAME = "TICKETS";
export const SUPPORT_ROLE_NAME = "Support";
export const SERVER_NAME = "Tr Aze RP";
export const STAFF_ROLE_ID = "1465970726816448667";

export const COLORS = {
  BLURPLE: 0x5865f2,
  GREEN: 0x57f287,
  RED: 0xed4245,
  YELLOW: 0xfee75c,
  DARK: 0x2b2d31,
  ORANGE: 0xf0a500,
} as const;

export const BUTTON_IDS = {
  CLAIM_TICKET: "claim_ticket",
  CLOSE_TICKET: "close_ticket",
  CONFIRM_CLOSE: "confirm_close",
  CANCEL_CLOSE: "cancel_close",
  RESET_SELECT: "reset_select",
  RATING_1: "rating_1",
  RATING_2: "rating_2",
  RATING_3: "rating_3",
  RATING_4: "rating_4",
  RATING_5: "rating_5",
} as const;

export const SELECT_IDS = {
  TICKET_CATEGORY: "ticket_category",
} as const;

export const CATEGORIES = [
  {
    label: "Oyun İçi Destek",
    value: "oyun_ici",
    description: "Oyun İçinde Yaşanan Problemler İçin",
    emoji: "🎮",
    displayEmoji: "🎮",
  },
  {
    label: "Oyun Dışı Destek",
    value: "oyun_disi",
    description: "Teknik Hatalar, Bug ve Şikayet İçin",
    emoji: "🎟️",
    displayEmoji: "🎟️",
  },
  {
    label: "Bağış (Donate)",
    value: "bagis",
    description: "Sunucuya Destek Olmak, Reklam ve Ortaklık İçin",
    emoji: "💎",
    displayEmoji: "💎",
  },
] as const;

export type CategoryValue = (typeof CATEGORIES)[number]["value"];
