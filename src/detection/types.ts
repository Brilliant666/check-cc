// CheckCC 的检测数据类型定义，用于描述地区、产品访问状态、信号结果和地区画像结构。
export type RegionCode = "auto" | "cn" | "ru" | "ir";
export type AccessStatus = "supported" | "possibly_supported" | "restricted" | "unsupported" | "unknown";
export type SignalSource = "browser" | "server" | "combined" | "network";

export type ProductAccess = {
  web: AccessStatus;
  pro: AccessStatus;
  api: AccessStatus;
  payment: AccessStatus;
};

export type SignalResult = {
  id: string;
  label: string;
  value: string | null;
  score: number;
  weight: number;
  contribution: number;
  source: SignalSource;
  evaluated?: boolean;
};

export type RegionProfile = {
  code: Exclude<RegionCode, "auto">;
  name: string;
  shortName: string;
  countries: string[];
  timezones: string[];
  languages: string[];
  browserPatterns: string[];
  devicePatterns: string[];
  fontFamilies: string[];
  weights: Record<string, number>;
  products: ProductAccess;
};
