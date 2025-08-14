import { define } from "../utils.ts";
import HomeComponent from "../islands/HomeComponent.tsx";

export default define.page(function Home() {
  return (
    <>
      <HomeComponent />
    </>
  );
});