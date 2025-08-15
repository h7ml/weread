import { define } from "../../utils.ts";
import BookDetailComponent from "../../islands/BookDetailComponent.tsx";
import SEO, { seoConfigs } from "../../components/SEO.tsx";
import { PageProps } from "$fresh/server.ts";
import { Handler } from "$fresh/server.ts";

// 服务端处理，获取图书信息用于SEO
export const handler: Handler = async (req, ctx) => {
  const bookId = ctx.params.id;
  
  // 尝试获取图书基本信息用于SEO
  let bookInfo = null;
  try {
    const bookResponse = await fetch(`${req.url.origin}/api/book/info?bookId=${bookId}`, {
      headers: req.headers
    });
    
    if (bookResponse.ok) {
      const data = await bookResponse.json();
      bookInfo = data.book;
    }
  } catch (error) {
    console.log("获取图书信息失败，使用默认SEO配置");
  }
  
  // 将图书信息传递给页面组件
  ctx.state.bookInfo = bookInfo;
  
  return await ctx.render();
};

export default define.page(function BookDetailPage(props: PageProps) {
  const bookId = props.params.id;
  const bookInfo = props.state.bookInfo;
  
  // 动态生成SEO配置
  const seoConfig = bookInfo ? 
    // 如果有图书信息，使用完整的动态SEO
    seoConfigs.book(
      bookInfo.title || `图书 ${bookId}`,
      bookInfo.author || "未知作者", 
      bookInfo.category || bookInfo.categories?.[0] || undefined,
      bookInfo.cover || undefined,
      bookInfo.isbn || undefined,
      bookInfo.publisher || undefined,
      bookInfo.newRating || bookInfo.rating || undefined
    ) :
    // 否则使用基础配置
    {
      title: `图书详情 - ${bookId}`,
      description: `查看图书《${bookId}》的详细信息、章节列表和阅读进度。支持AI语音朗读、智能笔记、进度同步等功能。`,
      keywords: `${bookId},图书详情,在线阅读,电子书,免费阅读,TTS朗读`,
      type: "book" as const,
    };
  
  // 添加当前URL
  seoConfig.url = props.url.toString();
  
  return (
    <>
      <SEO {...seoConfig} />
      <div>
        <BookDetailComponent />
      </div>
    </>
  );
});
