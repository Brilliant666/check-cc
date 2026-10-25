// CheckCC 的全站布局入口，用于声明 SEO 元信息、全局样式和页面根结构。
import type { Metadata } from "next";
import { siteUrl } from "@/site-config";
import "./globals.css";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: "检查 Claude 封号风险",
    template: "%s｜CheckCC",
  },
  description: "浏览器环境指纹引擎，综合扫描 Claude 运行环境、地区画像与账号环境风险",
  ...(siteUrl
    ? {
        alternates: {
          canonical: "/",
          languages: {
            "zh-CN": "/",
            "zh-HK": "/hong-kong",
            ru: "/russia",
            en: "/en",
          },
        },
      }
    : {}),
  openGraph: {
    type: "website",
    ...(siteUrl ? { url: siteUrl } : {}),
    siteName: "CheckCC",
    title: "检查 Claude 封号风险",
    description: "浏览器环境指纹引擎，综合扫描 Claude 运行环境、地区画像与账号环境风险",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "检查 Claude 封号风险",
    description: "浏览器环境指纹引擎，综合扫描 Claude 运行环境、地区画像与账号环境风险",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
