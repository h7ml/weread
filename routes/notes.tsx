import { define } from "../utils.ts";
import NotesComponent from "../islands/NotesComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function NotesPage(props: PageProps) {
  const seoConfig = {
    ...seoConfigs.notes,
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <NotesComponent />
    </>
  );
});
