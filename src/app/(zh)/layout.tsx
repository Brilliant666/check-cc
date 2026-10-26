// CheckCC 的中文根布局，用于声明中文页面的文档语言与站点元信息。
import type { Metadata } from "next";
import { buildLocaleMetadata, htmlLang } from "@/i18n/metadata";
import "../globals.css";

export const metadata: Metadata = buildLocaleMetadata("zh");

export default function ZhRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={htmlLang.zh} className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
