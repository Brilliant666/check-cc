// 基于 ASN 和网络组织名称的出口 IP 类型启发式分类，不发起额外网络请求。
export type IpType = "datacenter" | "residential" | "carrier" | "unknown";

export type IpTypeInput = {
  asn?: string | null;
  org?: string | null;
  isp?: string | null;
};

const RESIDENTIAL_PATTERNS = [
  "google fiber",
  "comcast",
  "charter",
  "spectrum",
  "verizon",
  "at&t",
  "cox communications",
  "frontier",
  "centurylink",
  "xfinity",
  "bt broadband",
  "deutsche telekom",
  "orange",
  "telefonica",
  "vodafone",
  "telstra",
  "bell canada",
  "rogers",
  "broadband",
  "cable",
  "residential",
];

const DATACENTER_PATTERNS = [
  "amazon",
  "aws",
  "google cloud",
  "google llc",
  "microsoft",
  "azure",
  "oracle",
  "digitalocean",
  "linode",
  "akamai",
  "ovh",
  "hetzner",
  "vultr",
  "cloudflare",
  "leaseweb",
  "contabo",
  "alibaba",
  "aliyun",
  "tencent cloud",
  "tencent",
  "huawei cloud",
  "baidu cloud",
  "ucloud",
  "qingcloud",
  "hosting",
  "datacenter",
  "data center",
  "server",
  "cloud",
];

const CARRIER_PATTERNS = [
  "china telecom",
  "china unicom",
  "china mobile",
  "china broadcasting network",
  "chunghwa telecom",
  "kddi",
  "ntt",
  "sk broadband",
  "kt corp",
  "lg u+",
  "softbank",
];

function matches(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern));
}

export function classifyIpType({ asn, org, isp }: IpTypeInput): IpType {
  const text = [asn, org, isp].filter(Boolean).join(" ").toLowerCase();
  if (!text) return "unknown";
  if (matches(text, RESIDENTIAL_PATTERNS)) return "residential";
  if (matches(text, DATACENTER_PATTERNS)) return "datacenter";
  if (matches(text, CARRIER_PATTERNS)) return "carrier";
  return "unknown";
}
