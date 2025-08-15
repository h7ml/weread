import { define } from "../utils.ts";
import DashboardComponent from "../islands/DashboardComponent.tsx";
import { seoConfigs } from "../components/SEO.tsx";

export default define.page(function DashboardPage({ state }) {
  // 设置仪表板SEO配置
  state.title = seoConfigs.dashboard.title;
  
  return (
    <>
      <DashboardComponent />
    </>
  );
});
