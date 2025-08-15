import { define } from "../utils.ts";
import ShelfComponent from "../islands/ShelfComponent.tsx";
import { seoConfigs } from "../components/SEO.tsx";

export default define.page(function ShelfPage({ state }) {
  // 设置书架页SEO配置
  state.title = seoConfigs.shelf.title;
  
  return (
    <div>
      <ShelfComponent />
    </div>
  );
});
