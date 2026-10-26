// CheckCC 的 robots.txt 生成器，用于声明抓取规则并在配置站点域名时指向 sitemap。
import type { MetadataRoute } from "next";
import { siteUrl } from "@/site-config";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl } : {}),
  };
}
