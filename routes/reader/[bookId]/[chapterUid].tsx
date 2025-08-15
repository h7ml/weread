import { define } from "../../../utils.ts";
import WeReadStyleReaderComponent from "../../../islands/WeReadStyleReaderComponent.tsx";
import SEO, { seoConfigs } from "../../../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";
import { Handler } from "$fresh/server.ts";

// 服务端处理，获取章节和图书信息用于SEO
export const handler: Handler = async (req, ctx) => {
  const { bookId, chapterUid } = ctx.params;
  
  let bookInfo = null;
  let chapterInfo = null;
  let chapterContent = null;
  
  try {
    // 并行获取图书信息和章节信息
    const [bookResponse, chapterResponse] = await Promise.allSettled([
      fetch(`${req.url.origin}/api/book/info?bookId=${bookId}`, {
        headers: req.headers
      }),
      fetch(`${req.url.origin}/api/book/chapters?bookId=${bookId}`, {
        headers: req.headers
      })
    ]);
    
    // 处理图书信息
    if (bookResponse.status === 'fulfilled' && bookResponse.value.ok) {
      const data = await bookResponse.value.json();
      bookInfo = data.book;
    }
    
    // 处理章节信息
    if (chapterResponse.status === 'fulfilled' && chapterResponse.value.ok) {
      const data = await chapterResponse.value.json();
      const chapters = data.data?.updated || [];
      chapterInfo = chapters.find((chapter: any) => chapter.chapterUid === chapterUid);
    }
    
    // 获取章节内容（用于SEO描述，只取前100个字符）
    if (chapterInfo) {
      try {
        const contentResponse = await fetch(`${req.url.origin}/api/book/content?bookId=${bookId}&chapterUid=${chapterUid}`, {
          headers: req.headers
        });
        
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          chapterContent = contentData.content;
        }
      } catch (error) {
        console.log("获取章节内容失败");
      }
    }
    
  } catch (error) {
    console.log("获取页面信息失败，使用默认SEO配置");
  }
  
  // 将信息传递给页面组件
  ctx.state.bookInfo = bookInfo;
  ctx.state.chapterInfo = chapterInfo;
  ctx.state.chapterContent = chapterContent;
  
  return await ctx.render();
};

export default define.page(function ReaderPage(props: PageProps) {
  const { bookId, chapterUid } = props.params;
  const bookInfo = props.state.bookInfo;
  const chapterInfo = props.state.chapterInfo;
  const chapterContent = props.state.chapterContent;
  
  // 动态生成阅读器页面SEO配置
  const seoConfig = (bookInfo && chapterInfo) ? 
    // 如果有完整信息，使用动态SEO
    seoConfigs.reader(
      bookInfo.title || `图书 ${bookId}`,
      chapterInfo.title || `章节 ${chapterUid}`,
      bookInfo.author || undefined,
      chapterContent || undefined
    ) :
    // 否则使用基础配置
    {
      title: `章节 ${chapterUid} - 图书 ${bookId}`,
      description: `正在阅读图书《${bookId}》的章节内容。享受沉浸式阅读体验，支持AI语音朗读、智能笔记等功能。`,
      keywords: `${bookId},${chapterUid},章节阅读,在线阅读器,TTS语音朗读,阅读笔记`,
      type: "article" as const,
      robots: "noindex, follow",
    };
  
  // 添加当前URL
  seoConfig.url = props.url.toString();
  
  return (
    <>
      <SEO {...seoConfig} />
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <link rel="stylesheet" href="/weread-reader.css" />
        <WeReadStyleReaderComponent />
      </div>
    </>
  );
});
