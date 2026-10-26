// CheckCC 的中文首页路由，用于在根路径渲染中文检测页面。
import { HomeContent } from "@/components/home/HomeContent";

export default function Home() {
  return <HomeContent locale="zh" />;
}
