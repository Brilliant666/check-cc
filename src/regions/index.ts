// CheckCC 的地区画像规则，用于定义国家、时区、语言、浏览器和设备特征；语言规则见 detection/scoring.ts。
import type { RegionProfile } from "@/detection/types";

export const REGION_PROFILES: RegionProfile[] = [
  {
    code: "cn",
    name: "中国大陆",
    countries: ["CN"],
    timezones: ["Asia/Shanghai", "Asia/Urumqi", "Asia/Chongqing", "Asia/Harbin", "Asia/Kashgar"],
    browserPatterns: ["micromessenger", "qqbrowser", "quark", "ucbrowser", "baidubrowser", "bidubrowser", "baiduboxapp", "miuibrowser", "huaweibrowser", "360se", "360ee", "qihu"],
    devicePatterns: ["huawei", "honor", "xiaomi", "redmi", "oppo", "vivo", "harmonyos", "realme", "oneplus", "miui"],
  },
  {
    code: "hk",
    name: "香港",
    countries: ["HK"],
    timezones: ["Asia/Hong_Kong"],
    browserPatterns: [],
    devicePatterns: [],
  },
  {
    code: "ru",
    name: "俄罗斯",
    countries: ["RU"],
    timezones: [
      "Europe/Kaliningrad",
      "Europe/Moscow",
      "Europe/Simferopol",
      "Europe/Samara",
      "Europe/Volgograd",
      "Europe/Kirov",
      "Europe/Astrakhan",
      "Europe/Saratov",
      "Europe/Ulyanovsk",
      "Asia/Yekaterinburg",
      "Asia/Omsk",
      "Asia/Novosibirsk",
      "Asia/Barnaul",
      "Asia/Tomsk",
      "Asia/Novokuznetsk",
      "Asia/Krasnoyarsk",
      "Asia/Irkutsk",
      "Asia/Chita",
      "Asia/Yakutsk",
      "Asia/Khandyga",
      "Asia/Vladivostok",
      "Asia/Ust-Nera",
      "Asia/Magadan",
      "Asia/Sakhalin",
      "Asia/Srednekolymsk",
      "Asia/Kamchatka",
      "Asia/Anadyr",
    ],
    browserPatterns: ["yabrowser", "yandex", "mail.ru"],
    devicePatterns: [],
  },
  {
    code: "ir",
    name: "伊朗",
    countries: ["IR"],
    timezones: ["Asia/Tehran"],
    browserPatterns: [],
    devicePatterns: [],
  },
];

export function getRegionProfile(code: string | null | undefined) {
  return REGION_PROFILES.find((profile) => profile.code === code) ?? null;
}
