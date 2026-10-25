// 站点身份配置：构建时可通过 NEXT_PUBLIC_SITE_URL 和 NEXT_PUBLIC_REPO_URL 覆盖。
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ? trimTrailingSlash(process.env.NEXT_PUBLIC_SITE_URL) : "";
export const repoUrl = trimTrailingSlash(process.env.NEXT_PUBLIC_REPO_URL || "https://github.com/Brilliant666/check-cc");
export const repoLabel = repoUrl.replace(/^https?:\/\//, "");
export const upstreamRepoUrl = "https://github.com/yacuo/check-cc";
