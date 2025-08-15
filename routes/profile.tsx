import { define } from "../utils.ts";
import ProfileComponent from "../islands/ProfileComponent.tsx";
import SEO, { seoConfigs } from "../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";

export default define.page(function ProfilePage(props: PageProps) {
  const seoConfig = {
    ...seoConfigs.profile,
    url: props.url.toString(),
  };
  
  return (
    <>
      <SEO {...seoConfig} />
      <ProfileComponent />
    </>
  );
});
