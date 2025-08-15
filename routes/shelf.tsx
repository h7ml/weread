import { define } from "../utils.ts";
import ShelfComponent from "../islands/ShelfComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function ShelfPage(props: PageProps) {
  const seoConfig = {
    ...seoConfigs.shelf,
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <div>
        <ShelfComponent />
      </div>
    </>
  );
});
