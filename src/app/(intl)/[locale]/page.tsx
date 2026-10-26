// CheckCC 的多语言页面路由，用于生成静态语言路径并按 URL slug 渲染对应本地化首页。
import { notFound } from "next/navigation";
import { HomeContent } from "@/components/home/HomeContent";
import { getLocaleBySlug, localeRoutes, type LocaleSlug } from "@/i18n/messages";

export function generateStaticParams() {
  return Object.values(localeRoutes)
    .filter((route): route is { slug: LocaleSlug; label: string; lang: string } => Boolean(route.slug))
    .map((route) => ({ locale: route.slug }));
}

export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = getLocaleBySlug((await params).locale);
  if (!locale) notFound();
  return <HomeContent locale={locale} />;
}
