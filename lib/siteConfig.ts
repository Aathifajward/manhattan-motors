/**
 * Single source of truth for Manhattan Motors' public business details.
 *
 * These values were lifted verbatim out of the old homepage contact/location
 * sections and messages/*.json when those sections were removed — this file is
 * now the only place they live. Update them here and the footer, the contact
 * page and the location/sell sections all follow.
 */

export const siteConfig = {
  name: "Manhattan Motors",

  /** Street address, one line per line break. */
  address: {
    en: "3-12-5 Hitotsugi-cho\nKariya City, Aichi 448-0003\nJapan",
    ja: "〒448-0003\n愛知県刈谷市一ツ木町3-12-5",
  },

  phone: {
    /** Dialled by `tel:`. */
    tel: "090-3959-3883",
    /** What a human reads on screen. */
    display: "090-3959-3883",
  },

  email: "manhattanmotors.726@gmail.com",

  line: {
    id: "Maz615",
    url: "https://line.me/ti/p/~Maz615",
  },

  openingHours: {
    en: "Mon – Fri, 9:00 AM – 6:00 PM",
    ja: "月〜金, 9:00 - 18:00",
  },

  maps: {
    /** Shared short link — used for "open in Maps" / "get directions". */
    shortUrl: "https://maps.app.goo.gl/FmmMz14kUWkGk1HcA",
    /** Lat,lng of the lot, for the keyless iframe embed. */
    coords: "35.0089697,137.0262555",
  },
} as const;

/** `tel:` href for the configured phone number. */
export const telHref = `tel:${siteConfig.phone.tel}`;

/** `mailto:` href for the configured address. */
export const mailtoHref = `mailto:${siteConfig.email}`;

/** Where "get directions" / "open in Maps" should go. */
export const mapsDirectionsUrl = siteConfig.maps.shortUrl;

/** Keyless Google Maps embed URL (iframe `src`), localised. */
export function mapsEmbedUrlFor(locale: string): string {
  const hl = locale === "ja" ? "ja" : "en";
  return `https://maps.google.com/maps?q=${siteConfig.maps.coords}&hl=${hl}&z=16&output=embed`;
}

/** Locale-aware address / hours. */
export function addressFor(locale: string): string {
  return locale === "ja" ? siteConfig.address.ja : siteConfig.address.en;
}

export function openingHoursFor(locale: string): string {
  return locale === "ja" ? siteConfig.openingHours.ja : siteConfig.openingHours.en;
}
