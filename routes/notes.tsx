import { Head } from "$fresh/runtime.ts";
import NotesComponent from "../islands/NotesComponent.tsx";

export default function NotesPage() {
  return (
    <>
      <Head>
        <title>笔记管理 - 微信读书</title>
        <meta name="description" content="管理您的阅读笔记、书签和书评" />
      </Head>
      <NotesComponent />
    </>
  );
}
