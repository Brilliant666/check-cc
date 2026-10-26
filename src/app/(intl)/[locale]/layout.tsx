// CheckCC 的多语言根布局，用于按语言声明文档语言并提供本地化元信息。
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildLocaleMetadata, htmlLang } from "@/i18n/metadata";
import { getLocaleBySlug } from "@/i18n/messages";
import "../../globals.css";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = getLocaleBySlug((await params).locale);
  return locale ? buildLocaleMetadata(locale) : {};
}

export default async function IntlRootLayout({ children, params }: LayoutProps) {
  const locale = getLocaleBySlug((await params).locale);
  if (!locale) notFound();
  return (
    <html lang={htmlLang[locale]} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
