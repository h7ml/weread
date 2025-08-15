import { define } from "../utils.ts";
import SearchComponent from "../islands/SearchComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function Search(props: PageProps) {
  // 从URL获取搜索参数
  const searchParams = new URL(props.url).searchParams;
  const query = searchParams.get('q');
  
  // 设置搜索页SEO配置
  const seoConfig = {
    ...seoConfigs.search(query || undefined),
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <SearchComponent />
    </>
  );
});
