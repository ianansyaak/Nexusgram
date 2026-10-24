export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  format?: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: "RU", name: "Россия", flag: "🇷🇺", dialCode: "+7", format: "+7 (999) 000-00-00" },
  { code: "KZ", name: "Казахстан", flag: "🇰🇿", dialCode: "+77", format: "+7 (700) 000-00-00" },
  { code: "UA", name: "Украина", flag: "🇺🇦", dialCode: "+380", format: "+380 (00) 000-00-00" },
  { code: "BY", name: "Беларусь", flag: "🇧🇾", dialCode: "+375", format: "+375 (00) 000-00-00" },
  { code: "UZ", name: "Узбекистан", flag: "🇺🇿", dialCode: "+998", format: "+998 (00) 000-00-00" },
  { code: "AZ", name: "Азербайджан", flag: "🇦🇿", dialCode: "+994", format: "+994 (00) 000-00-00" },
  { code: "GE", name: "Грузия", flag: "🇬🇪", dialCode: "+995", format: "+995 (000) 00-00-00" },
  { code: "AM", name: "Армения", flag: "🇦🇲", dialCode: "+374", format: "+374 (00) 00-00-00" },
  { code: "KG", name: "Кыргызстан", flag: "🇰🇬", dialCode: "+996", format: "+996 (000) 00-00-00" },
  { code: "TJ", name: "Таджикистан", flag: "🇹🇯", dialCode: "+992", format: "+992 (00) 000-00-00" },
  { code: "TM", name: "Туркменистан", flag: "🇹🇲", dialCode: "+993", format: "+993 (0) 000-00-00" },
  { code: "MD", name: "Молдова", flag: "🇲🇩", dialCode: "+373", format: "+373 (00) 00-00-00" },
  { code: "US", name: "США", flag: "🇺🇸", dialCode: "+1", format: "+1 (000) 000-0000" },
  { code: "CA", name: "Канада", flag: "🇨🇦", dialCode: "+1", format: "+1 (000) 000-0000" },
  { code: "GB", name: "Великобритания", flag: "🇬🇧", dialCode: "+44", format: "+44 0000 000000" },
  { code: "DE", name: "Германия", flag: "🇩🇪", dialCode: "+49", format: "+49 000 0000000" },
  { code: "FR", name: "Франция", flag: "🇫🇷", dialCode: "+33", format: "+33 0 00 00 00 00" },
  { code: "ES", name: "Испания", flag: "🇪🇸", dialCode: "+34", format: "+34 000 00 00 00" },
  { code: "IT", name: "Италия", flag: "🇮🇹", dialCode: "+39", format: "+39 000 000 0000" },
  { code: "TR", name: "Турция", flag: "🇹🇷", dialCode: "+90", format: "+90 000 000 0000" },
  { code: "AE", name: "ОАЭ", flag: "🇦🇪", dialCode: "+971", format: "+971 00 000 0000" },
  { code: "PL", name: "Польша", flag: "🇵🇱", dialCode: "+48", format: "+48 000 000 000" },
  { code: "CZ", name: "Чехия", flag: "🇨🇿", dialCode: "+420", format: "+420 000 000 000" },
  { code: "IL", name: "Израиль", flag: "🇮🇱", dialCode: "+972", format: "+972 00-000-0000" },
  { code: "CY", name: "Кипр", flag: "🇨🇾", dialCode: "+357", format: "+357 00 000000" },
  { code: "LV", name: "Латвия", flag: "🇱🇻", dialCode: "+371", format: "+371 00 000 000" },
  { code: "LT", name: "Литва", flag: "🇱🇹", dialCode: "+370", format: "+370 000 00000" },
  { code: "EE", name: "Эстония", flag: "🇪🇪", dialCode: "+372", format: "+372 0000 0000" },
  { code: "CN", name: "Китай", flag: "🇨🇳", dialCode: "+86", format: "+86 000 0000 0000" },
  { code: "IN", name: "Индия", flag: "🇮🇳", dialCode: "+91", format: "+91 00000 00000" },
  { code: "BR", name: "Бразилия", flag: "🇧🇷", dialCode: "+55", format: "+55 00 00000-0000" },
];

/**
 * Detect country info by phone number input (e.g. "+7999...", "8999...", "+380...", "+1...")
 */
export function detectCountryByPhone(phone: string): CountryInfo {
  if (!phone) {
    return { code: "UN", name: "Международный", flag: "🌐", dialCode: "+" };
  }

  let cleaned = phone.trim();
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("8") && cleaned.length > 1) {
      cleaned = "+7" + cleaned.slice(1);
    } else {
      cleaned = "+" + cleaned;
    }
  }

  // Sort countries by dialCode length descending to match +998 before +9, etc.
  const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const c of sorted) {
    if (cleaned.startsWith(c.dialCode)) {
      return c;
    }
  }

  return { code: "UN", name: "Международный", flag: "🌐", dialCode: "+" };
}
