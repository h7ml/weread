import { define } from "../utils.ts";
import NotesComponent from "../islands/NotesComponent.tsx";
import { seoConfigs } from "../components/SEO.tsx";

export default define.page(function NotesPage({ state }) {
  // 设置笔记页SEO配置
  state.title = seoConfigs.notes.title;
  
  return (
    <>
      <NotesComponent />
    </>
  );
});
