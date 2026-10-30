// CheckCC 的检测数据类型定义，用于描述地区、信号结果和地区画像结构。
export type RegionCode = "auto" | "cn" | "hk" | "ru" | "ir";
export type SignalSource = "browser" | "server" | "combined" | "network";

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
  countries: string[];
  timezones: string[];
  browserPatterns: string[];
  devicePatterns: string[];
};
