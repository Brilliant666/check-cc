// CheckCC 的 sitemap.xml 生成器，用于在配置站点域名时为四种语言页面生成站点地图。
import type { MetadataRoute } from "next";
import { localeRoutes, type LocaleCode } from "@/i18n/messages";
import { languageAlternates, localePath } from "@/i18n/metadata";
import { siteUrl } from "@/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];
  const absolute = (path: string) => `${siteUrl}${path === "/" ? "/" : `${path}/`}`;
  const languages = Object.fromEntries(Object.entries(languageAlternates()).map(([lang, path]) => [lang, absolute(path)]));
  return (Object.keys(localeRoutes) as LocaleCode[]).map((locale) => ({
    url: absolute(localePath(locale)),
    changeFrequency: "weekly" as const,
    priority: locale === "zh" ? 1 : 0.8,
    alternates: { languages },
  }));
}
