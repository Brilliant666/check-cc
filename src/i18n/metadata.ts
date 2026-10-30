// CheckCC 的多语言站点元信息，用于按语言生成标题、描述、canonical 与 hreflang。
import type { Metadata } from "next";
import { localeRoutes, messages, type LocaleCode } from "@/i18n/messages";
import { siteUrl } from "@/site-config";

export const htmlLang: Record<LocaleCode, string> = {
  zh: "zh-CN",
  "zh-HK": "zh-HK",
  ru: "ru-RU",
  en: "en",
};

const openGraphLocales: Record<LocaleCode, string> = {
  zh: "zh_CN",
  "zh-HK": "zh_HK",
  ru: "ru_RU",
  en: "en_US",
};

export function localePath(locale: LocaleCode) {
  const slug = localeRoutes[locale].slug;
  return slug ? `/${slug}` : "/";
}

export function languageAlternates() {
  const languages = Object.fromEntries(Object.entries(localeRoutes).map(([code, route]) => [htmlLang[code as LocaleCode], route.slug ? `/${route.slug}` : "/"]));
  // Visitors whose language matches none of the pages get the Simplified Chinese home page.
  return { ...languages, "x-default": "/" };
}

// Share cards in public/, rendered from docs/og/card.html.
const shareImages: Record<LocaleCode, string> = {
  zh: "/og-zh.png",
  "zh-HK": "/og-zh-HK.png",
  ru: "/og-ru.png",
  en: "/og-en.png",
};

export function buildLocaleMetadata(locale: LocaleCode): Metadata {
  const copy = messages[locale];
  const path = localePath(locale);
  const title = locale === "zh" ? copy.hero.title : `${copy.hero.title}｜CheckCC`;
  // Crawlers need an absolute image URL, so the card is only declared once the site URL is known.
  const image = siteUrl ? { url: `${siteUrl}${shareImages[locale]}`, width: 1200, height: 630, alt: copy.hero.title } : null;
  return {
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title,
    description: copy.hero.subtitle,
    ...(siteUrl ? { alternates: { canonical: path, languages: languageAlternates() } } : {}),
    openGraph: {
      type: "website",
      ...(siteUrl ? { url: `${siteUrl}${path}` } : {}),
      siteName: "CheckCC",
      title: copy.hero.title,
      description: copy.hero.subtitle,
      locale: openGraphLocales[locale],
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: copy.hero.title,
      description: copy.hero.subtitle,
      ...(image ? { images: [image.url] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}
