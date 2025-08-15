import { define } from "../utils.ts";
import HomeComponent from "../islands/HomeComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function Home(props: PageProps) {
  const seoConfig = {
    ...seoConfigs.home,
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <HomeComponent />
    </>
  );
});
