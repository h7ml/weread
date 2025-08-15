import { Head } from "$fresh/runtime.ts";
import ProfileComponent from "../islands/ProfileComponent.tsx";

export default function ProfilePage() {
  return (
    <>
      <Head>
        <title>个人中心 - 微信读书</title>
        <meta name="description" content="查看您的阅读统计、成就和个人设置" />
      </Head>
      <ProfileComponent />
    </>
  );
}
