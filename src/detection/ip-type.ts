// 基于 ASN 和网络组织名称的出口 IP 类型启发式分类，不发起额外网络请求。
import { matchToken } from "./scoring";

export type IpType = "datacenter" | "residential" | "carrier" | "unknown";

export type IpTypeInput = {
  asn?: string | null;
  org?: string | null;
  isp?: string | null;
};

// 明确的云厂商和托管商名称，优先级最高。
const DATACENTER_NAMES = [
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
  "tencent",
  "huawei cloud",
  "baidu cloud",
  "ucloud",
  "qingcloud",
];

const CARRIER_NAMES = [
  "china telecom",
  "chinanet",
  "china unicom",
  "unicom",
  "china mobile",
  "cmnet",
  "china broadcasting network",
  "chunghwa telecom",
  "kddi",
  "ntt",
  "sk broadband",
  "kt corp",
  "lg u+",
  "softbank",
];

const RESIDENTIAL_NAMES = [
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
  "orange s.a",
  "orange polska",
  "telefonica",
  "vodafone",
  "telstra",
  "bell canada",
  "rogers",
];

// 泛化关键词只在没有命中具体名称时使用。
const DATACENTER_KEYWORDS = ["hosting", "datacenter", "data center", "colocation", "vps", "dedicated server"];
const RESIDENTIAL_KEYWORDS = ["residential", "broadband", "cable", "dsl"];

export function classifyIpType({ asn, org, isp }: IpTypeInput): IpType {
  const text = [asn, org, isp].filter(Boolean).join(" ");
  if (!text) return "unknown";
  if (matchToken(text, DATACENTER_NAMES)) return "datacenter";
  if (matchToken(text, CARRIER_NAMES)) return "carrier";
  if (matchToken(text, RESIDENTIAL_NAMES)) return "residential";
  if (matchToken(text, DATACENTER_KEYWORDS)) return "datacenter";
  if (matchToken(text, RESIDENTIAL_KEYWORDS)) return "residential";
  return "unknown";
}
