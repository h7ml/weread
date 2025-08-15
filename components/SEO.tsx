/**
 * SEO 组件 - 完整的SEO优化和社交分享配置
 *
 * @description 提供完整的TDK(Title、Description、Keywords)管理和社交平台分享优化
 * @author h7ml <h7ml@qq.com>
 * @version 2.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { Head } from "$fresh/runtime.ts";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "book" | "profile";
  siteName?: string;
  locale?: string;
  robots?: string;
  canonical?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  
  // 图书相关信息
  bookTitle?: string;
  bookAuthor?: string;
  bookCategory?: string;
  bookIsbn?: string;
  bookPublisher?: string;
  bookPublishedDate?: string;
  bookRating?: number;
  
  // 文章相关信息
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTags?: string[];
  
  // 社交分享配置
  wechat?: {
    title?: string;
    desc?: string;
    imgUrl?: string;
  };
  weibo?: {
    title?: string;
    pic?: string;
  };
  qq?: {
    title?: string;
    desc?: string;
    summary?: string;
    pics?: string;
  };
  
  jsonLd?: Record<string, any>;
}

const defaultSEO: Required<Omit<SEOProps, "jsonLd" | "bookTitle" | "bookAuthor" | "bookCategory" | "bookIsbn" | "bookPublisher" | "bookPublishedDate" | "bookRating" | "articleAuthor" | "articlePublishedTime" | "articleModifiedTime" | "articleSection" | "articleTags" | "wechat" | "weibo" | "qq">> = {
  title: "微信读书 Web - 智能阅读平台，让阅读更美好",
  description: "基于 Fresh (Deno) 构建的微信读书 Web 阅读应用。提供现代化阅读界面、AI语音朗读、智能笔记管理、个性化推荐等功能。支持章节导航、进度同步、离线阅读，打造完美的数字阅读体验。",
  keywords: "微信读书,在线阅读,电子书阅读器,TTS语音朗读,智能笔记,阅读统计,数字图书馆,Fresh框架,Deno应用,PWA应用,离线阅读,阅读器,电子书管理,读书笔记,阅读进度,书签管理",
  author: "h7ml",
  image: "/logo.svg",
  url: "https://webook.linuxcloudlab.com",
  type: "website",
  siteName: "微信读书 Web",
  locale: "zh_CN",
  robots: "index, follow",
  canonical: "",
  twitterCard: "summary_large_image",
};

export default function SEO(props: SEOProps) {
  const seo = { ...defaultSEO, ...props };
  
  // 确保 title 不为 undefined，优化TDK
  const title = seo.title || defaultSEO.title;
  const fullTitle = title === defaultSEO.title 
    ? title 
    : `${title} - ${defaultSEO.siteName}`;
  
  // 处理描述，确保在150-160字符之间
  const description = seo.description || defaultSEO.description;
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + "..." 
    : description;
  
  // 处理关键词，确保相关性
  const keywords = seo.keywords || defaultSEO.keywords;
  
  const imageUrl = seo.image && seo.image.startsWith('http') 
    ? seo.image 
    : `${seo.url}${seo.image || defaultSEO.image}`;
  
  const canonicalUrl = seo.canonical || seo.url;

  return (
    <Head>
      {/* 基础 TDK Meta 标签 */}
      <title>{fullTitle}</title>
      <meta name="description" content={truncatedDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={seo.author} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph 标签 (Facebook, LinkedIn等) */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={seo.url} />
      <meta property="og:type" content={seo.type} />
      <meta property="og:site_name" content={seo.siteName} />
      <meta property="og:locale" content={seo.locale} />
      
      {/* 图书相关的 Open Graph */}
      {seo.type === "book" && seo.bookTitle && (
        <>
          <meta property="book:title" content={seo.bookTitle} />
          {seo.bookAuthor && <meta property="book:author" content={seo.bookAuthor} />}
          {seo.bookIsbn && <meta property="book:isbn" content={seo.bookIsbn} />}
          {seo.bookPublisher && <meta property="book:publisher" content={seo.bookPublisher} />}
          {seo.bookPublishedDate && <meta property="book:release_date" content={seo.bookPublishedDate} />}
          {seo.bookCategory && <meta property="book:tag" content={seo.bookCategory} />}
        </>
      )}
      
      {/* 文章相关的 Open Graph */}
      {seo.type === "article" && (
        <>
          {seo.articleAuthor && <meta property="article:author" content={seo.articleAuthor} />}
          {seo.articlePublishedTime && <meta property="article:published_time" content={seo.articlePublishedTime} />}
          {seo.articleModifiedTime && <meta property="article:modified_time" content={seo.articleModifiedTime} />}
          {seo.articleSection && <meta property="article:section" content={seo.articleSection} />}
          {seo.articleTags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card 标签 */}
      <meta name="twitter:card" content={seo.twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:site" content="@weread_web" />
      <meta name="twitter:creator" content="@h7ml" />
      
      {/* 微信分享配置 */}
      {seo.wechat && (
        <>
          <meta name="wechat:title" content={seo.wechat.title || fullTitle} />
          <meta name="wechat:desc" content={seo.wechat.desc || truncatedDescription} />
          <meta name="wechat:imgUrl" content={seo.wechat.imgUrl || imageUrl} />
        </>
      )}
      
      {/* 微博分享配置 */}
      {seo.weibo && (
        <>
          <meta name="weibo:title" content={seo.weibo.title || fullTitle} />
          <meta name="weibo:pic" content={seo.weibo.pic || imageUrl} />
        </>
      )}
      
      {/* QQ分享配置 */}
      {seo.qq && (
        <>
          <meta name="qq:title" content={seo.qq.title || fullTitle} />
          <meta name="qq:desc" content={seo.qq.desc || truncatedDescription} />
          <meta name="qq:summary" content={seo.qq.summary || truncatedDescription} />
          <meta name="qq:pics" content={seo.qq.pics || imageUrl} />
        </>
      )}
      
      {/* 额外的优化Meta标签 */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="application-name" content={seo.siteName} />
      <meta name="apple-mobile-web-app-title" content={seo.siteName} />
      
      {/* 搜索引擎验证标签 */}
      <meta name="google-site-verification" content="" />
      <meta name="baidu-site-verification" content="" />
      <meta name="360-site-verification" content="" />
      <meta name="sogou_site_verification" content="" />
      
      {/* Structured Data (JSON-LD) */}
      {props.jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(props.jsonLd),
          }}
        />
      )}
    </Head>
  );
}

// 高级SEO配置生成器
export const seoConfigs = {
  // 首页 - 重点优化TDK
  home: {
    title: "首页",
    description: "微信读书 Web - 智能阅读平台，汇聚海量优质图书资源。提供AI语音朗读、智能笔记管理、个性化推荐等功能。支持离线阅读、进度同步，让阅读更便捷、更智能、更有趣。",
    keywords: "微信读书首页,在线阅读平台,电子书阅读,智能阅读,AI朗读,数字图书馆,阅读器应用,免费电子书",
    type: "website" as const,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "微信读书 Web",
      alternateName: "微信读书在线阅读平台",
      description: "智能阅读平台，让阅读更美好",
      url: "https://webook.linuxcloudlab.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://webook.linuxcloudlab.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      mainEntity: {
        "@type": "WebApplication",
        name: "微信读书 Web",
        applicationCategory: "EducationApplication",
        operatingSystem: "Web Browser",
        offers: {
          "@type": "Offer",
          "priceCurrency": "CNY",
        }
      }
    },
    wechat: {
      title: "微信读书 Web - 智能阅读平台",
      desc: "海量图书，AI语音朗读，让阅读更美好",
      imgUrl: "/logo.svg"
    }
  },
  
  // 动态图书详情页SEO生成器
  book: (bookTitle: string, bookAuthor: string, bookCategory?: string, bookCover?: string, bookIsbn?: string, bookPublisher?: string, bookRating?: number) => ({
    title: `《${bookTitle}》- ${bookAuthor}`,
    description: `在线阅读《${bookTitle}》，作者：${bookAuthor}${bookCategory ? `，分类：${bookCategory}` : ''}。支持AI语音朗读、智能笔记、进度同步等功能。微信读书 Web 为您提供最佳的数字阅读体验。`,
    keywords: `${bookTitle},${bookAuthor}${bookCategory ? `,${bookCategory}` : ''},在线阅读,电子书,免费阅读,TTS朗读${bookPublisher ? `,${bookPublisher}` : ''}`,
    type: "book" as const,
    image: bookCover || "/logo.svg",
    
    // 图书专用字段
    bookTitle,
    bookAuthor,
    bookCategory,
    bookIsbn,
    bookPublisher,
    bookRating,
    
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Book",
      name: bookTitle,
      author: {
        "@type": "Person",
        name: bookAuthor
      },
      description: `《${bookTitle}》- 作者：${bookAuthor}`,
      image: bookCover,
      ...(bookIsbn && { isbn: bookIsbn }),
      ...(bookPublisher && { publisher: { "@type": "Organization", name: bookPublisher } }),
      ...(bookCategory && { genre: bookCategory }),
      ...(bookRating && { 
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: bookRating,
          bestRating: 5,
          worstRating: 1
        }
      }),
      potentialAction: {
        "@type": "ReadAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `https://webook.linuxcloudlab.com/reader/{bookId}/chapter1`
        }
      }
    },
    
    wechat: {
      title: `《${bookTitle}》- ${bookAuthor}`,
      desc: `${bookCategory ? `${bookCategory} · ` : ''}在线阅读，支持AI语音朗读`,
      imgUrl: bookCover || "/logo.svg"
    },
    
    weibo: {
      title: `正在阅读《${bookTitle}》- ${bookAuthor}`,
      pic: bookCover || "/logo.svg"
    },
    
    qq: {
      title: `《${bookTitle}》`,
      desc: `作者：${bookAuthor}${bookCategory ? ` | 分类：${bookCategory}` : ''}`,
      summary: `推荐一本好书《${bookTitle}》，作者${bookAuthor}，值得一读！`,
      pics: bookCover || "/logo.svg"
    }
  }),
  
  // 动态阅读器页面SEO生成器
  reader: (bookTitle: string, chapterTitle: string, bookAuthor?: string, chapterContent?: string) => ({
    title: `${chapterTitle} - 《${bookTitle}》`,
    description: `正在阅读《${bookTitle}》的${chapterTitle}${bookAuthor ? `，作者：${bookAuthor}` : ''}。${chapterContent ? chapterContent.substring(0, 100) + '...' : '享受沉浸式阅读体验，支持AI语音朗读、智能笔记等功能。'}`,
    keywords: `${bookTitle},${chapterTitle}${bookAuthor ? `,${bookAuthor}` : ''},章节阅读,在线阅读器,TTS语音朗读,阅读笔记`,
    type: "article" as const,
    robots: "noindex, follow", // 具体章节不需要被搜索引擎索引
    
    // 文章相关字段
    articleAuthor: bookAuthor,
    articleSection: bookTitle,
    articleTags: [bookTitle, chapterTitle, "在线阅读", "电子书"],
    
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${chapterTitle} - 《${bookTitle}》`,
      description: `《${bookTitle}》${chapterTitle}章节内容`,
      ...(bookAuthor && { 
        author: {
          "@type": "Person", 
          name: bookAuthor
        }
      }),
      isPartOf: {
        "@type": "Book",
        name: bookTitle
      },
      potentialAction: {
        "@type": "ReadAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: window.location.href
        }
      }
    },
    
    wechat: {
      title: `${chapterTitle}`,
      desc: `《${bookTitle}》${bookAuthor ? ` - ${bookAuthor}` : ''}`,
    }
  }),
  
  // 搜索页面 - 动态SEO
  search: (query?: string) => ({
    title: query ? `搜索"${query}"的结果` : "图书搜索 - 发现更多好书",
    description: query 
      ? `在微信读书 Web 中搜索"${query}"的相关图书、作者和内容。发现更多优质阅读资源，享受智能阅读体验。`
      : "在微信读书 Web 中搜索图书、作者和内容。海量图书资源，智能推荐算法，帮您发现更多感兴趣的好书。",
    keywords: query 
      ? `${query},图书搜索,电子书搜索,在线搜索,阅读推荐`
      : "图书搜索,电子书发现,阅读推荐,在线搜索,智能推荐",
    type: "website" as const,
    jsonLd: query ? {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      mainEntity: {
        "@type": "ItemList",
        name: `"${query}"的搜索结果`
      }
    } : undefined
  }),
  
  // 私有页面配置
  dashboard: {
    title: "阅读统计",
    description: "查看您的个人阅读统计数据，包括阅读时长、书籍数量、阅读习惯分析等详细报告。",
    keywords: "阅读统计,阅读分析,阅读报告,阅读数据,个人统计",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  notes: {
    title: "我的笔记",
    description: "管理您的阅读笔记、书签和书评，记录阅读心得和重要片段，让知识更好地沉淀。",
    keywords: "阅读笔记,书签管理,书评,读书心得,知识管理",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  profile: {
    title: "个人中心",
    description: "管理您的个人信息、阅读偏好和账户设置，个性化定制您的阅读体验。",
    keywords: "个人设置,阅读偏好,账户管理,个人信息",
    type: "profile" as const,
    robots: "noindex, follow",
  },
  
  shelf: {
    title: "我的书架",
    description: "管理您的个人图书收藏，整理和查看已收藏的图书，打造专属的数字图书馆。",
    keywords: "个人书架,图书收藏,电子书管理,数字图书馆",
    type: "profile" as const,
    robots: "noindex, follow",
  }
};
