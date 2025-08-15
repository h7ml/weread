import { define } from "../utils.ts";
import SearchComponent from "../islands/SearchComponent.tsx";
import { seoConfigs } from "../components/SEO.tsx";

export default define.page(function Search({ state, url }) {
  // 从URL获取搜索参数
  const searchParams = new URL(url).searchParams;
  const query = searchParams.get('q');
  
  // 设置搜索页SEO配置
  const seoConfig = seoConfigs.search(query || undefined);
  state.title = seoConfig.title;
  
  return (
    <>
      <SearchComponent />
    </>
  );
});
