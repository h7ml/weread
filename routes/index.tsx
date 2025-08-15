import { define } from "../utils.ts";
import HomeComponent from "../islands/HomeComponent.tsx";
import { seoConfigs } from "../components/SEO.tsx";

export default define.page(function Home({ state }) {
  // 设置首页SEO配置
  state.title = seoConfigs.home.title;
  
  return (
    <>
      <HomeComponent />
    </>
  );
});
