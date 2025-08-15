import { Head } from "$fresh/runtime.ts";
import DashboardComponent from "../islands/DashboardComponent.tsx";

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>阅读统计 - 微信读书</title>
        <meta
          name="description"
          content="查看详细的阅读统计数据、趋势分析和个人阅读报告"
        />
      </Head>
      <DashboardComponent />
    </>
  );
}
