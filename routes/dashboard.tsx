import { define } from "../utils.ts";
import DashboardComponent from "../islands/DashboardComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function DashboardPage(props: PageProps) {
  const seoConfig = {
    ...seoConfigs.dashboard,
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <DashboardComponent />
    </>
  );
});
