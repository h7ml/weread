/** @jsx h */
import { h } from "preact";
import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

export default function WeReadStyleReaderComponent() {
  // 默认设置配置
  const defaultSettings = {
    fontSize: 18,
    lineHeight: 1.8,
    theme: "light",
    fontFamily: "system",
    pageWidth: "narrow",
    ttsSettings: {
      rate: 1,
      volume: 0.8,
      pitch: 1,
      autoNext: true,
      background: true,
      engine: "browser", // browser | leftsite | openxing
      voiceURI: "",
      style: "general",
      ttsProvider: "leftsite",
    },
    autoReading: {
      isActive: false,
      isPaused: false,
      scrollSpeed: 50,
      autoNext: true,
      smoothScroll: true,
    },
  };

  const bookId = useSignal("");
  const chapterUid = useSignal("");
  const content = useSignal("");
  const chapterTitle = useSignal("");
  const chapters = useSignal([] as any[]);
  const currentChapterIndex = useSignal(0);
  const loading = useSignal(true);
  const error = useSignal("");

  // 阅读设置 - 使用默认值初始化
  const fontSize = useSignal(defaultSettings.fontSize);
  const lineHeight = useSignal(defaultSettings.lineHeight);
  const theme = useSignal(defaultSettings.theme);
  const fontFamily = useSignal(defaultSettings.fontFamily);
  const pageWidth = useSignal(defaultSettings.pageWidth);

  // UI状态
  const showTopBar = useSignal(true);
  const showBottomBar = useSignal(true);
  const showSettings = useSignal(false);
  const showChapterList = useSignal(false);
  const activeSettingsTab = useSignal("display"); // display | voice | reading

  // TTS功能状态 - 使用默认值初始化
  const ttsSettings = useSignal({ ...defaultSettings.ttsSettings });
  const ttsState = useSignal({
    isPlaying: false,
    isPaused: false,
    sentences: [] as string[],
    sentenceElements: [] as Element[],
    currentSentenceIndex: 0,
    utterance: null as SpeechSynthesisUtterance | null,
    startTime: 0,
    azureVoices: [],
    currentAudio: null as HTMLAudioElement | null,
    serviceStatus: "checking" as "checking" | "available" | "unavailable",
  });

  // 自动阅读状态 - 使用默认值初始化
  const autoReading = useSignal({ ...defaultSettings.autoReading });

  // 引用
  const contentRef = useRef<HTMLDivElement>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);
  const availableVoices = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem("weread_token");
    if (!token) {
      globalThis.location.href = "/login";
      return;
    }

    // 从URL获取参数
    const path = globalThis.location.pathname;
    const parts = path.split("/");
    const bookIdFromUrl = parts[2];
    const chapterUidFromUrl = parts[3];

    if (!bookIdFromUrl || !chapterUidFromUrl) {
      error.value = "缺少必要参数";
      loading.value = false;
      return;
    }

    bookId.value = bookIdFromUrl;
    chapterUid.value = chapterUidFromUrl;

    // 加载数据
    loadChapterContent(token, bookIdFromUrl, chapterUidFromUrl);
    loadChapterList(token, bookIdFromUrl);

    // 加载设置
    loadSettings();

    // 初始化TTS
    initializeTTS();

    // 设置自动隐藏定时器
    resetHideTimer();

    // 监听用户活动
    const handleUserActivity = () => {
      showTopBar.value = true;
      showBottomBar.value = true;
      resetHideTimer();
    };

    document.addEventListener("mousemove", handleUserActivity);
    document.addEventListener("click", handleUserActivity);
    document.addEventListener("touchstart", handleUserActivity);

    return () => {
      document.removeEventListener("mousemove", handleUserActivity);
      document.removeEventListener("click", handleUserActivity);
      document.removeEventListener("touchstart", handleUserActivity);
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    stopTTS();
    stopAutoReading();
  };

  const resetHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (
        !showSettings.value && !showChapterList.value &&
        !ttsState.value.isPlaying
      ) {
        showTopBar.value = false;
        showBottomBar.value = false;
      }
    }, 3000);
  };

  const loadSettings = () => {
    // 加载基础阅读设置，如果没有保存的值则使用默认值
    fontSize.value = parseInt(
      localStorage.getItem("weread_fontSize") ||
        defaultSettings.fontSize.toString(),
    );
    lineHeight.value = parseFloat(
      localStorage.getItem("weread_lineHeight") ||
        defaultSettings.lineHeight.toString(),
    );
    theme.value = localStorage.getItem("weread_theme") || defaultSettings.theme;
    fontFamily.value = localStorage.getItem("weread_fontFamily") ||
      defaultSettings.fontFamily;
    pageWidth.value = localStorage.getItem("weread_pageWidth") ||
      defaultSettings.pageWidth;

    // 加载TTS设置，智能合并默认值和保存的值
    const savedTtsSettings = localStorage.getItem("weread_ttsSettings");
    if (savedTtsSettings) {
      try {
        const parsed = JSON.parse(savedTtsSettings);
        ttsSettings.value = { ...defaultSettings.ttsSettings, ...parsed };
      } catch (error) {
        console.warn("TTS设置解析失败，使用默认设置:", error);
        ttsSettings.value = { ...defaultSettings.ttsSettings };
      }
    }

    // 加载自动阅读设置
    const savedAutoReading = localStorage.getItem("weread_autoReading");
    if (savedAutoReading) {
      try {
        const parsed = JSON.parse(savedAutoReading);
        autoReading.value = { ...defaultSettings.autoReading, ...parsed };
      } catch (error) {
        console.warn("自动阅读设置解析失败，使用默认设置:", error);
        autoReading.value = { ...defaultSettings.autoReading };
      }
    }

    console.log("设置加载完成:", {
      fontSize: fontSize.value,
      ttsEngine: ttsSettings.value.engine,
      ttsVoice: ttsSettings.value.voiceURI,
    });
  };

  const saveSettings = () => {
    // 实时保存所有设置到localStorage
    localStorage.setItem("weread_fontSize", fontSize.value.toString());
    localStorage.setItem("weread_lineHeight", lineHeight.value.toString());
    localStorage.setItem("weread_theme", theme.value);
    localStorage.setItem("weread_fontFamily", fontFamily.value);
    localStorage.setItem("weread_pageWidth", pageWidth.value);
    localStorage.setItem(
      "weread_ttsSettings",
      JSON.stringify(ttsSettings.value),
    );
    localStorage.setItem(
      "weread_autoReading",
      JSON.stringify(autoReading.value),
    );

    console.log("设置已保存:", {
      ttsEngine: ttsSettings.value.engine,
      ttsVoice: ttsSettings.value.voiceURI,
    });
  };

  // 实时保存设置的辅助函数
  const updateTTSSettings = (
    updates: Partial<typeof defaultSettings.ttsSettings>,
  ) => {
    ttsSettings.value = { ...ttsSettings.value, ...updates };
    saveSettings();
  };

  const updateReadingSettings = (key: string, value: any) => {
    switch (key) {
      case "fontSize":
        fontSize.value = value;
        break;
      case "lineHeight":
        lineHeight.value = value;
        break;
      case "theme":
        theme.value = value;
        break;
      case "fontFamily":
        fontFamily.value = value;
        break;
      case "pageWidth":
        pageWidth.value = value;
        break;
    }
    saveSettings();
  };

  const initializeTTS = async () => {
    if (typeof window !== "undefined" && globalThis.speechSynthesis) {
      speechSynthesis.current = globalThis.speechSynthesis;

      // 初始化浏览器语音列表
      const loadVoices = () => {
        const voices = speechSynthesis.current?.getVoices() || [];
        availableVoices.current = voices;
        console.log("可用浏览器语音数量:", voices.length);
      };

      loadVoices();
      speechSynthesis.current.addEventListener("voiceschanged", loadVoices);

      // 加载外部TTS语音列表
      await loadExternalVoices();
    }
  };

  const loadExternalVoices = async () => {
    try {
      const response = await fetch("/api/tts/voices?engine=all");
      if (response.ok) {
        const voices = await response.json();
        ttsState.value = { ...ttsState.value, azureVoices: voices };
        console.log("外部TTS语音加载完成:", voices.length, "个语音");

        // 检查服务状态
        const hasLeftsite = voices.some((v: any) => v.provider === "leftsite");
        const hasOpenxing = voices.some((v: any) => v.provider === "openxing");

        if (hasLeftsite || hasOpenxing) {
          ttsState.value = { ...ttsState.value, serviceStatus: "available" };
          console.log("外部TTS服务可用");

          // 智能设置默认语音
          setDefaultVoiceForEngine();
        } else {
          ttsState.value = { ...ttsState.value, serviceStatus: "unavailable" };
          console.log("外部TTS服务不可用，回退到浏览器TTS");
        }
      } else {
        throw new Error("语音列表加载失败");
      }
    } catch (error) {
      console.warn("外部TTS语音加载失败:", error);
      ttsState.value = { ...ttsState.value, serviceStatus: "unavailable" };
    }
  };

  // 为当前引擎设置默认语音（如果还没有设置的话）
  const setDefaultVoiceForEngine = () => {
    const currentEngine = ttsSettings.value.engine;
    const currentVoice = ttsSettings.value.voiceURI;

    // 如果已经设置了语音且该语音适合当前引擎，则不需要更改
    if (currentVoice) {
      const availableVoices = getAvailableVoicesForEngine(currentEngine);
      const voiceExists = availableVoices.some((v) =>
        (v.short_name || v.name) === currentVoice
      );
      if (voiceExists) {
        return; // 当前语音仍然有效
      }
    }

    // 设置引擎的第一个可用语音作为默认
    const firstVoice = getFirstVoiceForEngine(currentEngine);
    if (firstVoice) {
      updateTTSSettings({ voiceURI: firstVoice.short_name || firstVoice.name });
      console.log(
        `为 ${currentEngine} 引擎设置默认语音:`,
        firstVoice.display_name || firstVoice.name,
      );
    }
  };

  // 获取指定引擎的可用语音列表
  const getAvailableVoicesForEngine = (engine: string) => {
    if (engine === "browser") {
      return availableVoices.current;
    } else if (engine === "leftsite") {
      return ttsState.value.azureVoices.filter((v: any) =>
        v.provider === "leftsite"
      );
    } else if (engine === "openxing") {
      return ttsState.value.azureVoices.filter((v: any) =>
        v.provider === "openxing"
      );
    }
    return [];
  };

  // 获取指定引擎的第一个语音
  const getFirstVoiceForEngine = (engine: string) => {
    const voices = getAvailableVoicesForEngine(engine);
    return voices.length > 0 ? voices[0] : null;
  };

  // 智能引擎切换函数
  const switchTTSEngine = (newEngine: string) => {
    const updates: any = { engine: newEngine };

    // 根据引擎设置提供商
    if (newEngine === "leftsite") {
      updates.ttsProvider = "leftsite";
    } else if (newEngine === "openxing") {
      updates.ttsProvider = "openxing";
    }

    // 设置该引擎的第一个可用语音
    const firstVoice = getFirstVoiceForEngine(newEngine);
    if (firstVoice) {
      updates.voiceURI = firstVoice.short_name || firstVoice.name;
      console.log(
        `切换到 ${newEngine} 引擎，默认语音:`,
        firstVoice.display_name || firstVoice.name,
      );
    } else {
      updates.voiceURI = "";
      console.log(`切换到 ${newEngine} 引擎，无可用语音`);
    }

    updateTTSSettings(updates);
  };

  const loadChapterContent = async (
    token: string,
    bookId: string,
    chapterUid: string,
  ) => {
    try {
      const response = await fetch(
        `/api/book/content?bookId=${bookId}&chapterUid=${chapterUid}&token=${token}`,
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          globalThis.location.href = "/login";
          return;
        }
        throw new Error(`加载章节失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        content.value = processContentForDisplay(data.data.content);
      } else {
        error.value = data.error || "加载失败";
      }
    } catch (err) {
      console.error("Failed to load chapter content:", err);
      error.value = `加载章节内容失败: ${err.message}`;
    }
  };

  const processContentForDisplay = (rawContent: string) => {
    let processedContent = rawContent;

    // 如果内容包含完整的HTML文档结构，提取body内容
    const htmlMatch = processedContent.match(/<html[^>]*>([\s\S]*?)<\/html>/i);
    if (htmlMatch) {
      const htmlContent = htmlMatch[1];

      // 提取style标签中的样式
      const styleMatch = processedContent.match(
        /<style[^>]*>([\s\S]*?)<\/style>/i,
      );
      let styles = "";
      if (styleMatch) {
        styles = `<style>${styleMatch[1]}</style>`;
      }

      // 提取body内容
      const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        processedContent = styles + bodyMatch[1];
      } else {
        // 如果没有body标签，使用html内容但去掉head部分
        const headEndIndex = htmlContent.indexOf("</head>");
        if (headEndIndex !== -1) {
          processedContent = styles + htmlContent.substring(headEndIndex + 7);
        } else {
          processedContent = styles + htmlContent;
        }
      }
    }

    // 处理图片URL
    processedContent = processedContent.replace(
      /<img([^>]*?)src="([^"]*)"([^>]*?)>/g,
      (match, before, src, after) => {
        let finalSrc = src;
        if (src.startsWith("//")) {
          finalSrc = "https:" + src;
        } else if (src.startsWith("/") && !src.startsWith("//")) {
          finalSrc = "https://res.weread.qq.com" + src;
        }
        return `<img${before}src="${finalSrc}"${after} loading="lazy">`;
      },
    );

    return processedContent;
  };

  const loadChapterList = async (token: string, bookId: string) => {
    try {
      const response = await fetch(
        `/api/book/chapters?bookId=${bookId}&token=${token}`,
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          chapters.value = data.data.chapters || [];

          const index = chapters.value.findIndex((ch) =>
            ch.chapterUid === chapterUid.value
          );
          if (index >= 0) {
            currentChapterIndex.value = index;
            chapterTitle.value = chapters.value[index].title;
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chapters:", err);
    } finally {
      loading.value = false;
    }
  };

  const navigateToChapter = async (direction: "prev" | "next") => {
    let newIndex;
    if (direction === "prev") {
      newIndex = Math.max(0, currentChapterIndex.value - 1);
    } else {
      newIndex = Math.min(
        chapters.value.length - 1,
        currentChapterIndex.value + 1,
      );
    }

    if (newIndex !== currentChapterIndex.value) {
      const newChapter = chapters.value[newIndex];

      // 停止当前的TTS和自动滚动
      stopTTS();
      stopAutoReading();

      currentChapterIndex.value = newIndex;
      chapterUid.value = newChapter.chapterUid;
      chapterTitle.value = newChapter.title;
      loading.value = true;
      content.value = "";

      globalThis.history.pushState(
        {},
        "",
        `/reader/${bookId.value}/${newChapter.chapterUid}`,
      );

      const token = localStorage.getItem("weread_token");
      if (token) {
        await loadChapterContent(token, bookId.value, newChapter.chapterUid);
      }
      loading.value = false;

      // 滚动到顶部
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }
  };

  // TTS相关功能
  const extractTextContent = (
    element: Element,
  ): { sentences: string[]; elements: Element[] } => {
    const sentences: string[] = [];
    const elements: Element[] = [];

    const walkNode = (node: Node, parentElement?: Element) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          // 按句号、问号、感叹号分句
          const sentenceArray = text.split(/[。！？；]\s*/).filter((s) =>
            s.trim().length > 0
          );
          sentenceArray.forEach((sentence) => {
            if (sentence.trim().length > 0) {
              sentences.push(sentence.trim() + "。");
              elements.push(parentElement || element);
            }
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        Array.from(elem.childNodes).forEach((child) => walkNode(child, elem));
      }
    };

    walkNode(element, element);
    return { sentences, elements };
  };

  const startTTS = async () => {
    if (!speechSynthesis.current || !contentRef.current) return;

    // 停止现有播放
    stopTTS();

    // 提取文本内容
    const result = extractTextContent(contentRef.current);

    if (result.sentences.length === 0) {
      alert("没有可朗读的文本内容");
      return;
    }

    // 更新TTS状态
    ttsState.value = {
      ...ttsState.value,
      isPlaying: true,
      isPaused: false,
      sentences: result.sentences,
      sentenceElements: result.elements,
      currentSentenceIndex: 0,
      startTime: Date.now(),
    };

    console.log("TTS开始播放，共", result.sentences.length, "个句子");

    // 开始朗读第一句
    await speakCurrentSentence();
  };

  const speakCurrentSentence = async () => {
    const state = ttsState.value;

    if (state.currentSentenceIndex >= state.sentences.length) {
      // 章节结束，检查是否自动翻页
      if (
        ttsSettings.value.autoNext &&
        currentChapterIndex.value < chapters.value.length - 1
      ) {
        console.log("TTS自动翻页到下一章");
        await navigateToChapter("next");
        // 导航完成后会自动停止TTS，需要重新启动
        setTimeout(() => {
          if (ttsSettings.value.autoNext) {
            startTTS();
          }
        }, 1000);
      } else {
        stopTTS();
      }
      return;
    }

    const sentence = state.sentences[state.currentSentenceIndex];
    if (!sentence?.trim()) {
      // 跳过空句子
      ttsState.value = {
        ...state,
        currentSentenceIndex: state.currentSentenceIndex + 1,
      };
      await speakCurrentSentence();
      return;
    }

    // 高亮当前句子对应的元素
    highlightCurrentSentence();

    // 根据引擎选择播放方式
    if (
      (ttsSettings.value.engine === "leftsite" ||
        ttsSettings.value.engine === "openxing") &&
      ttsState.value.serviceStatus === "available"
    ) {
      await speakWithExternalTTS(sentence);
    } else {
      await speakWithBrowserTTS(sentence);
    }
  };

  const speakWithBrowserTTS = async (sentence: string) => {
    if (!speechSynthesis.current) return;

    // 创建语音合成utterance
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = ttsSettings.value.rate;
    utterance.volume = ttsSettings.value.volume;
    utterance.pitch = ttsSettings.value.pitch;

    // 选择中文语音
    const chineseVoice = availableVoices.current.find((voice) =>
      voice.lang.includes("zh") || voice.lang.includes("CN")
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    // 设置播放完成回调
    utterance.onend = () => {
      if (ttsState.value.isPlaying) {
        ttsState.value = {
          ...ttsState.value,
          currentSentenceIndex: ttsState.value.currentSentenceIndex + 1,
        };

        // 延迟一点再播放下一句
        setTimeout(() => {
          if (ttsState.value.isPlaying) {
            speakCurrentSentence();
          }
        }, 200);
      }
    };

    utterance.onerror = (event) => {
      console.error("语音合成错误:", event);
      stopTTS();
    };

    // 更新utterance引用并开始播放
    ttsState.value = {
      ...ttsState.value,
      utterance: utterance,
    };

    speechSynthesis.current.speak(utterance);
    console.log("浏览器TTS播放句子:", sentence.substring(0, 50) + "...");
  };

  const speakWithExternalTTS = async (sentence: string) => {
    try {
      // 停止之前的音频
      if (ttsState.value.currentAudio) {
        ttsState.value.currentAudio.pause();
      }

      // 根据引擎选择不同的请求方式
      let audioUrl = "";
      if (ttsSettings.value.engine === "openxing") {
        // OpenXing TTS 使用POST请求
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: sentence,
            voice: ttsSettings.value.voiceURI || "Dylan",
            engine: "openxing",
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenXing TTS请求失败: ${response.status}`);
        }

        const audioBlob = await response.blob();
        audioUrl = URL.createObjectURL(audioBlob);
      } else {
        // Leftsite TTS 使用GET请求
        const params = new URLSearchParams({
          t: sentence,
          v: ttsSettings.value.voiceURI || "zh-CN-XiaoxiaoNeural",
          r: Math.round((ttsSettings.value.rate - 1) * 50).toString(),
          p: ttsSettings.value.pitch.toString(),
          s: ttsSettings.value.style,
          engine: "leftsite",
        });

        audioUrl = `/api/tts?${params.toString()}`;
      }

      // 创建音频元素
      const audio = new Audio(audioUrl);
      audio.volume = ttsSettings.value.volume;

      audio.onended = () => {
        // 清理临时URL
        if (ttsSettings.value.engine === "openxing") {
          URL.revokeObjectURL(audioUrl);
        }

        // 播放下一句
        if (ttsState.value.isPlaying) {
          ttsState.value = {
            ...ttsState.value,
            currentSentenceIndex: ttsState.value.currentSentenceIndex + 1,
          };

          setTimeout(() => {
            if (ttsState.value.isPlaying) {
              speakCurrentSentence();
            }
          }, 200);
        }
      };

      audio.onerror = (error) => {
        console.error(
          `${ttsSettings.value.engine.toUpperCase()} TTS播放错误:`,
          error,
        );
        console.log("降级到浏览器TTS");

        // 清理临时URL
        if (ttsSettings.value.engine === "openxing") {
          URL.revokeObjectURL(audioUrl);
        }

        speakWithBrowserTTS(sentence);
      };

      // 更新当前音频引用
      ttsState.value = {
        ...ttsState.value,
        currentAudio: audio,
      };

      await audio.play();
      console.log(
        `${ttsSettings.value.engine.toUpperCase()} TTS播放句子:`,
        sentence.substring(0, 50) + "...",
      );
    } catch (error) {
      console.error(
        `${ttsSettings.value.engine.toUpperCase()} TTS完全失败，降级到浏览器TTS:`,
        error,
      );
      await speakWithBrowserTTS(sentence);
    }
  };

  const highlightCurrentSentence = () => {
    // 移除之前的高亮
    const prevHighlight = contentRef.current?.querySelector(
      ".tts-current-sentence",
    );
    if (prevHighlight) {
      prevHighlight.classList.remove("tts-current-sentence");
    }

    // 高亮当前句子
    const currentElement =
      ttsState.value.sentenceElements[ttsState.value.currentSentenceIndex];
    if (currentElement) {
      currentElement.classList.add("tts-current-sentence");

      // 滚动到当前句子
      currentElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const stopTTS = () => {
    // 停止浏览器TTS
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
    }

    // 停止Azure TTS音频
    if (ttsState.value.currentAudio) {
      ttsState.value.currentAudio.pause();
      ttsState.value.currentAudio.currentTime = 0;
    }

    // 移除所有高亮
    const highlights = contentRef.current?.querySelectorAll(
      ".tts-current-sentence",
    );
    highlights?.forEach((el) => el.classList.remove("tts-current-sentence"));

    ttsState.value = {
      ...ttsState.value,
      isPlaying: false,
      isPaused: false,
      utterance: null,
      currentAudio: null,
    };

    console.log("TTS已停止");
  };

  const toggleTTS = () => {
    if (ttsState.value.isPlaying) {
      stopTTS();
    } else {
      startTTS();
    }
  };

  // 自动滚动功能
  const startAutoReading = () => {
    if (autoReading.value.isActive) return;

    stopTTS(); // 停止TTS

    autoReading.value = {
      ...autoReading.value,
      isActive: true,
      isPaused: false,
    };

    startAutoScroll();
    console.log("自动阅读已开始");
  };

  const stopAutoReading = () => {
    autoReading.value = {
      ...autoReading.value,
      isActive: false,
      isPaused: false,
    };

    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }

    console.log("自动阅读已停止");
  };

  const startAutoScroll = () => {
    if (!autoReading.value.isActive || autoReading.value.isPaused) return;
    if (!contentRef.current) return;

    const scrollStep = Math.max(1, autoReading.value.scrollSpeed / 10);

    autoScrollTimer.current = setInterval(() => {
      if (
        !autoReading.value.isActive || autoReading.value.isPaused ||
        !contentRef.current
      ) {
        if (autoScrollTimer.current) {
          clearInterval(autoScrollTimer.current);
          autoScrollTimer.current = null;
        }
        return;
      }

      const element = contentRef.current;
      const currentScrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;

      // 检查是否到达底部
      if (currentScrollTop + clientHeight >= scrollHeight - 50) {
        if (
          autoReading.value.autoNext &&
          currentChapterIndex.value < chapters.value.length - 1
        ) {
          console.log("自动滚动翻页到下一章");
          navigateToChapter("next").then(() => {
            // 翻页后继续自动滚动
            setTimeout(() => {
              if (autoReading.value.isActive) {
                startAutoScroll();
              }
            }, 1000);
          });
        } else {
          stopAutoReading();
        }
        return;
      }

      // 继续滚动
      if (autoReading.value.smoothScroll) {
        element.scrollTo({
          top: currentScrollTop + scrollStep,
          behavior: "smooth",
        });
      } else {
        element.scrollTop = currentScrollTop + scrollStep;
      }

      // 强制更新进度条显示
      autoReading.value = { ...autoReading.value };
    }, 100);
  };

  const toggleAutoReading = () => {
    if (autoReading.value.isActive) {
      stopAutoReading();
    } else {
      startAutoReading();
    }
  };

  const getThemeClasses = () => {
    const themes = {
      light: "bg-white text-gray-900",
      sepia: "bg-amber-50 text-amber-900",
      dark: "bg-gray-800 text-gray-100",
      night: "bg-gray-900 text-gray-200",
      green: "bg-green-50 text-green-900",
      blue: "bg-blue-50 text-blue-900",
      purple: "bg-purple-50 text-purple-900",
      pink: "bg-pink-50 text-pink-900",
    };
    return themes[theme.value] || themes.light;
  };

  const getFontFamilyClass = () => {
    const fonts = {
      system: "font-sans",
      serif: "font-serif",
      reading: "font-mono",
    };
    return fonts[fontFamily.value] || fonts.system;
  };

  const getPageWidthClass = () => {
    const widths = {
      narrow: "max-w-2xl",
      medium: "max-w-4xl",
      wide: "max-w-6xl",
    };
    return widths[pageWidth.value] || widths.narrow;
  };

  if (loading.value) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-current mx-auto">
          </div>
          <p className="mt-4 text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  if (error.value) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${getThemeClasses()}`}
      >
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error.value}</p>
          <button
            onClick={() => globalThis.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${getThemeClasses()}`}
    >
      {/* 顶部工具栏 */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-current/5 backdrop-blur-sm border-b border-current/10 transition-transform duration-300 ${
          showTopBar.value ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => globalThis.location.href = "/"}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="返回首页"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>

            <button
              onClick={() => globalThis.location.href = "/shelf"}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="返回书架"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </button>

            <button
              onClick={() => showChapterList.value = !showChapterList.value}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="章节目录"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 text-center">
            <h1 className="text-lg font-medium truncate px-4">
              {chapterTitle.value}
            </h1>
            <p className="text-sm opacity-60">
              {currentChapterIndex.value + 1} / {chapters.value.length}
            </p>
          </div>

          <button
            onClick={() => {
              showSettings.value = !showSettings.value;
              resetHideTimer();
            }}
            className="p-2 rounded-lg hover:bg-current/10 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* TTS进度条 */}
      {ttsState.value.isPlaying && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-blue-600/10 backdrop-blur-sm border-b border-blue-300/20">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTTS}
                className="p-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title={ttsState.value.isPlaying ? "停止朗读" : "开始朗读"}
              >
                {ttsState.value.isPlaying
                  ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
              </button>

              <div className="flex-1 bg-current/20 rounded-full h-3 overflow-hidden relative progress-bar-container">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out rounded-full relative progress-bar-fill"
                  style={{
                    width: `${
                      (ttsState.value.currentSentenceIndex /
                        Math.max(1, ttsState.value.sentences.length)) * 100
                    }%`,
                  }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-medium text-blue-900/80 drop-shadow-sm">
                    {Math.round(
                      (ttsState.value.currentSentenceIndex /
                        Math.max(1, ttsState.value.sentences.length)) * 100,
                    )}%
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end text-right min-w-max">
                <span className="text-sm font-medium opacity-90">
                  {ttsState.value.currentSentenceIndex + 1} /{" "}
                  {ttsState.value.sentences.length}
                </span>
                <span className="text-xs opacity-70">
                  语音朗读中
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自动滚动进度条 */}
      {autoReading.value.isActive && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-green-600/10 backdrop-blur-sm border-b border-green-300/20">
          <div className="px-4 py-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleAutoReading}
                className="p-1 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                title={autoReading.value.isActive
                  ? "停止自动滚动"
                  : "开始自动滚动"}
              >
                {autoReading.value.isActive
                  ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )
                  : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19V5m0 0l-7 7m7-7l7 7"
                      />
                    </svg>
                  )}
              </button>

              <div className="flex-1 bg-current/20 rounded-full h-3 overflow-hidden relative progress-bar-container">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300 ease-linear rounded-full relative progress-bar-fill"
                  style={{
                    width: contentRef.current
                      ? `${
                        Math.min(
                          100,
                          (contentRef.current.scrollTop /
                            Math.max(
                              1,
                              contentRef.current.scrollHeight -
                                contentRef.current.clientHeight,
                            )) * 100,
                        )
                      }%`
                      : "0%",
                  }}
                >
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs font-medium text-green-900/80 drop-shadow-sm">
                    {contentRef.current
                      ? Math.round(
                        (contentRef.current.scrollTop /
                          Math.max(
                            1,
                            contentRef.current.scrollHeight -
                              contentRef.current.clientHeight,
                          )) * 100,
                      )
                      : 0}%
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end text-right min-w-max">
                <span className="text-sm font-medium opacity-90">
                  速度: {autoReading.value.scrollSpeed}
                </span>
                <span className="text-xs opacity-70">
                  自动滚动中
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容区域 */}
      <div
        className={`${
          (ttsState.value.isPlaying || autoReading.value.isActive)
            ? "pt-32"
            : "pt-20"
        } pb-20`}
      >
        <div className={`mx-auto px-6 ${getPageWidthClass()}`}>
          <div
            ref={contentRef}
            className={`${getFontFamilyClass()} reader-content max-w-none overflow-y-auto max-h-screen`}
            style={{
              fontSize: `${fontSize.value}px`,
              lineHeight: lineHeight.value,
            }}
            dangerouslySetInnerHTML={{ __html: content.value }}
          />
        </div>
      </div>

      {/* 底部工具栏 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-current/5 backdrop-blur-sm border-t border-current/10 transition-transform duration-300 ${
          showBottomBar.value ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToChapter("prev")}
              disabled={currentChapterIndex.value === 0}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>上一章</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => globalThis.location.href = "/"}
              className="p-2 rounded-lg hover:bg-current/10 transition-colors"
              title="返回首页"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>

            <button
              onClick={toggleAutoReading}
              className={`p-2 rounded-lg transition-colors ${
                autoReading.value.isActive
                  ? "bg-green-600 text-white"
                  : "hover:bg-current/10"
              }`}
              title="自动滚动阅读"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19V5m0 0l-7 7m7-7l7 7"
                />
              </svg>
            </button>

            <button
              onClick={toggleTTS}
              className={`p-2 rounded-lg transition-colors ${
                ttsState.value.isPlaying
                  ? "bg-blue-600 text-white"
                  : "hover:bg-current/10"
              }`}
              title="语音朗读"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728m-9.192-9.192L7.05 7.05A7 7 0 105 12a7 7 0 002.05-4.95l2.122-2.122z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToChapter("next")}
              disabled={currentChapterIndex.value === chapters.value.length - 1}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-current/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span>下一章</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 全屏设置面板 */}
      {showSettings.value && (
        <div className={`fixed inset-0 z-50 ${getThemeClasses()}`}>
          {/* 设置头部 */}
          <div className="sticky top-0 z-10 bg-current/5 backdrop-blur-sm border-b border-current/10">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() =>
                  showSettings.value = false}
                className="p-2 rounded-full hover:bg-current/10 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold">阅读设置</h1>
              <div className="w-10 h-10"></div>
            </div>

            {/* 标签切换 */}
            <div className="flex border-b border-current/10">
              <button
                onClick={() => activeSettingsTab.value = "display"}
                className={`flex-1 py-4 px-2 text-center font-medium transition-colors relative ${
                  activeSettingsTab.value === "display"
                    ? "text-blue-600"
                    : "text-current/70 hover:text-current"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🎨</span>
                  <span>显示</span>
                </div>
                {activeSettingsTab.value === "display" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600">
                  </div>
                )}
              </button>
              <button
                onClick={() => activeSettingsTab.value = "voice"}
                className={`flex-1 py-4 px-2 text-center font-medium transition-colors relative ${
                  activeSettingsTab.value === "voice"
                    ? "text-blue-600"
                    : "text-current/70 hover:text-current"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>🔊</span>
                  <span>语音</span>
                </div>
                {activeSettingsTab.value === "voice" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600">
                  </div>
                )}
              </button>
              <button
                onClick={() => activeSettingsTab.value = "reading"}
                className={`flex-1 py-4 px-2 text-center font-medium transition-colors relative ${
                  activeSettingsTab.value === "reading"
                    ? "text-blue-600"
                    : "text-current/70 hover:text-current"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>📖</span>
                  <span>阅读</span>
                </div>
                {activeSettingsTab.value === "reading" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600">
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* 设置内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {/* 显示设置 */}
            {activeSettingsTab.value === "display" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🎨</span>
                    主题风格
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      {
                        key: "light",
                        name: "默认",
                        bg: "bg-white",
                        text: "text-gray-900",
                        ring: "ring-gray-300",
                      },
                      {
                        key: "sepia",
                        name: "护眼",
                        bg: "bg-amber-50",
                        text: "text-amber-900",
                        ring: "ring-amber-300",
                      },
                      {
                        key: "dark",
                        name: "夜间",
                        bg: "bg-gray-800",
                        text: "text-gray-100",
                        ring: "ring-gray-600",
                      },
                      {
                        key: "night",
                        name: "深邃",
                        bg: "bg-gray-900",
                        text: "text-gray-200",
                        ring: "ring-gray-700",
                      },
                      {
                        key: "green",
                        name: "清新",
                        bg: "bg-green-50",
                        text: "text-green-900",
                        ring: "ring-green-300",
                      },
                      {
                        key: "blue",
                        name: "海洋",
                        bg: "bg-blue-50",
                        text: "text-blue-900",
                        ring: "ring-blue-300",
                      },
                      {
                        key: "purple",
                        name: "神秘",
                        bg: "bg-purple-50",
                        text: "text-purple-900",
                        ring: "ring-purple-300",
                      },
                      {
                        key: "pink",
                        name: "温柔",
                        bg: "bg-pink-50",
                        text: "text-pink-900",
                        ring: "ring-pink-300",
                      },
                    ].map((t) => (
                      <button
                        key={t.key}
                        onClick={() => updateReadingSettings("theme", t.key)}
                        className={`${t.bg} ${t.text} p-4 rounded-xl border-2 transition-all btn-scale ${
                          theme.value === t.key
                            ? `border-blue-500 ring-2 ${t.ring} scale-105`
                            : "border-current/20 hover:border-current/40 hover:scale-102"
                        }`}
                      >
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs opacity-60 mt-1">Aa</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">🔤</span>
                    字体设置
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">字体大小</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="12"
                            max="32"
                            value={fontSize.value}
                            onChange={(e) => {
                              const value = Math.max(
                                12,
                                Math.min(
                                  32,
                                  parseInt(e.currentTarget.value) || 12,
                                ),
                              );
                              updateReadingSettings("fontSize", value);
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">px</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((fontSize.value - 12) / (32 - 12)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="12"
                          max="32"
                          step="1"
                          value={fontSize.value}
                          onInput={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            updateReadingSettings("fontSize", value);
                            // 更新滑块填充
                            const percentage = ((value - 12) / (32 - 12)) * 100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>小</span>
                        <span>中</span>
                        <span>大</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">行间距</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1.2"
                            max="2.5"
                            step="0.1"
                            value={lineHeight.value}
                            onChange={(e) => {
                              const value = Math.max(
                                1.2,
                                Math.min(
                                  2.5,
                                  parseFloat(e.currentTarget.value) || 1.2,
                                ),
                              );
                              updateReadingSettings("lineHeight", value);
                            }}
                            className="number-input"
                          />
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((lineHeight.value - 1.2) / (2.5 - 1.2)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="1.2"
                          max="2.5"
                          step="0.1"
                          value={lineHeight.value}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateReadingSettings("lineHeight", value);
                            // 更新滑块填充
                            const percentage = ((value - 1.2) / (2.5 - 1.2)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>紧密</span>
                        <span>适中</span>
                        <span>宽松</span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium mb-3">字体类型</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: "system", name: "系统", desc: "无衬线" },
                          { key: "serif", name: "衬线", desc: "易读性" },
                          { key: "reading", name: "等宽", desc: "代码风格" },
                        ].map((font) => (
                          <button
                            key={font.key}
                            onClick={() =>
                              updateReadingSettings("fontFamily", font.key)}
                            className={`p-3 rounded-xl border-2 transition-all btn-scale ${
                              fontFamily.value === font.key
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-current/20 hover:bg-current/5"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {font.name}
                            </div>
                            <div className="text-xs opacity-60">
                              {font.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium mb-3">页面宽度</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { key: "narrow", name: "窄", desc: "专注阅读" },
                          { key: "medium", name: "中", desc: "平衡体验" },
                          { key: "wide", name: "宽", desc: "大屏优化" },
                        ].map((width) => (
                          <button
                            key={width.key}
                            onClick={() =>
                              updateReadingSettings("pageWidth", width.key)}
                            className={`p-3 rounded-xl border-2 transition-all btn-scale ${
                              pageWidth.value === width.key
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-current/20 hover:bg-current/5"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              {width.name}
                            </div>
                            <div className="text-xs opacity-60">
                              {width.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 语音设置 */}
            {activeSettingsTab.value === "voice" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span className="mr-2">🔊</span>
                      语音引擎
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          ttsState.value.serviceStatus === "available"
                            ? "bg-green-500"
                            : ttsState.value.serviceStatus === "checking"
                            ? "bg-yellow-500 animate-pulse"
                            : "bg-red-500"
                        }`}
                      >
                      </div>
                      <span className="text-xs opacity-70">
                        {ttsState.value.serviceStatus === "available"
                          ? "服务正常"
                          : ttsState.value.serviceStatus === "checking"
                          ? "检测中..."
                          : "服务异常"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => switchTTSEngine("browser")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left btn-scale ${
                        ttsSettings.value.engine === "browser"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">浏览器 TTS</div>
                          <div className="text-sm opacity-70">
                            免费使用，无需配置
                          </div>
                        </div>
                        <div className="text-2xl">🌐</div>
                      </div>
                    </button>

                    <button
                      onClick={() => switchTTSEngine("leftsite")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                        ttsSettings.value.engine === "leftsite"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Leftsite TTS</div>
                          <div className="text-sm opacity-70">
                            {ttsState.value.serviceStatus === "available"
                              ? "高音质，多语音选择"
                              : "服务不可用"}
                          </div>
                        </div>
                        <div className="text-2xl">🎯</div>
                      </div>
                      {ttsState.value.serviceStatus === "unavailable" && (
                        <div className="absolute inset-0 bg-gray-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-sm text-red-600 font-medium">
                            服务不可用
                          </span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={() => switchTTSEngine("openxing")}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left relative ${
                        ttsSettings.value.engine === "openxing"
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-current/20 hover:bg-current/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">OpenXing TTS</div>
                          <div className="text-sm opacity-70">
                            {ttsState.value.serviceStatus === "available"
                              ? "超拟人语音体验"
                              : "服务不可用"}
                          </div>
                        </div>
                        <div className="text-2xl">⭐</div>
                      </div>
                      {ttsState.value.serviceStatus === "unavailable" && (
                        <div className="absolute inset-0 bg-gray-500/20 rounded-xl flex items-center justify-center">
                          <span className="text-sm text-red-600 font-medium">
                            服务不可用
                          </span>
                        </div>
                      )}
                    </button>
                  </div>

                  {(ttsSettings.value.engine === "leftsite" ||
                    ttsSettings.value.engine === "openxing") &&
                    ttsState.value.serviceStatus === "unavailable" && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm text-orange-700 flex items-center">
                        <span className="mr-2">⚠️</span>
                        云端TTS服务当前不可用，将自动降级到浏览器TTS
                      </div>
                    </div>
                  )}
                </div>

                {(ttsSettings.value.engine === "leftsite" ||
                  ttsSettings.value.engine === "openxing") &&
                  ttsState.value.serviceStatus === "available" && (
                  <div className="bg-current/3 rounded-2xl p-6 settings-card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <span className="mr-2">🎤</span>
                      语音选择
                    </h3>
                    <select
                      value={ttsSettings.value.voiceURI}
                      onChange={(e) =>
                        updateTTSSettings({ voiceURI: e.currentTarget.value })}
                      className="w-full p-4 border border-current/20 rounded-xl bg-transparent text-base"
                    >
                      <option value="">选择语音...</option>
                      {ttsState.value.azureVoices
                        .filter((voice: any) => {
                          if (ttsSettings.value.engine === "leftsite") {
                            return voice.provider === "leftsite";
                          } else if (ttsSettings.value.engine === "openxing") {
                            return voice.provider === "openxing";
                          }
                          return false;
                        })
                        .map((voice: any) => (
                          <option
                            key={voice.short_name || voice.name}
                            value={voice.short_name || voice.name}
                          >
                            {voice.display_name || voice.displayName ||
                              voice.local_name}
                            {voice.description ? ` - ${voice.description}` : ""}
                            ({voice.gender === "Female" ? "女声" : "男声"})
                          </option>
                        ))}
                    </select>

                    {ttsState.value.azureVoices.length === 0 && (
                      <div className="text-sm text-current/60 mt-2 flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2">
                        </div>
                        加载语音列表中...
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">⚙️</span>
                    语音控制
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">语音语速</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={ttsSettings.value.rate}
                            onChange={(e) => {
                              const value = Math.max(
                                0.5,
                                Math.min(
                                  2,
                                  parseFloat(e.currentTarget.value) || 1,
                                ),
                              );
                              updateTTSSettings({ rate: value });
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">x</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((ttsSettings.value.rate - 0.5) / (2 - 0.5)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={ttsSettings.value.rate}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateTTSSettings({ rate: value });
                            // 更新滑块填充
                            const percentage = ((value - 0.5) / (2 - 0.5)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>慢</span>
                        <span>正常</span>
                        <span>快</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">语音音量</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            value={Math.round(ttsSettings.value.volume * 100)}
                            onChange={(e) => {
                              const value = Math.max(
                                10,
                                Math.min(
                                  100,
                                  parseInt(e.currentTarget.value) || 80,
                                ),
                              );
                              updateTTSSettings({ volume: value / 100 });
                            }}
                            className="number-input"
                          />
                          <span className="text-xs opacity-70">%</span>
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((ttsSettings.value.volume - 0.1) / (1 - 0.1)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={ttsSettings.value.volume}
                          onInput={(e) => {
                            const value = parseFloat(e.currentTarget.value);
                            updateTTSSettings({ volume: value });
                            // 更新滑块填充
                            const percentage = ((value - 0.1) / (1 - 0.1)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>🔇</span>
                        <span>🔊</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">📖</span>
                        <div>
                          <div className="font-medium">自动翻页</div>
                          <div className="text-sm opacity-70">
                            章节读完自动跳转
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={ttsSettings.value.autoNext}
                        onChange={(e) => {
                          ttsSettings.value = {
                            ...ttsSettings.value,
                            autoNext: e.currentTarget.checked,
                          };
                          saveSettings();
                        }}
                        className="w-5 h-5 accent-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 阅读设置 */}
            {activeSettingsTab.value === "reading" && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-current/3 rounded-2xl p-6 settings-card">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <span className="mr-2">📖</span>
                    自动滚动
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium">滚动速度</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="10"
                            max="100"
                            step="5"
                            value={autoReading.value.scrollSpeed}
                            onChange={(e) => {
                              const value = Math.max(
                                10,
                                Math.min(
                                  100,
                                  parseInt(e.currentTarget.value) || 50,
                                ),
                              );
                              autoReading.value = {
                                ...autoReading.value,
                                scrollSpeed: value,
                              };
                              saveSettings();
                            }}
                            className="number-input"
                          />
                        </div>
                      </div>
                      <div
                        className="range-slider"
                        style={{
                          "--slider-value": `${
                            ((autoReading.value.scrollSpeed - 10) /
                              (100 - 10)) * 100
                          }%`,
                        } as any}
                      >
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={autoReading.value.scrollSpeed}
                          onInput={(e) => {
                            const value = parseInt(e.currentTarget.value);
                            autoReading.value = {
                              ...autoReading.value,
                              scrollSpeed: value,
                            };
                            saveSettings();
                            // 更新滑块填充
                            const percentage = ((value - 10) / (100 - 10)) *
                              100;
                            const parent = e.currentTarget
                              .parentElement as HTMLElement;
                            if (parent) {
                              parent.style.setProperty(
                                "--slider-value",
                                `${percentage}%`,
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-current/60 mt-2">
                        <span>慢</span>
                        <span>适中</span>
                        <span>快</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">✨</span>
                          <div>
                            <div className="font-medium">平滑滚动</div>
                            <div className="text-sm opacity-70">
                              启用丝滑的滚动效果
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoReading.value.smoothScroll}
                          onChange={(e) => {
                            autoReading.value = {
                              ...autoReading.value,
                              smoothScroll: e.currentTarget.checked,
                            };
                            saveSettings();
                          }}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-current/5 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">➡️</span>
                          <div>
                            <div className="font-medium">自动翻页</div>
                            <div className="text-sm opacity-70">
                              滚动到底部自动下一章
                            </div>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoReading.value.autoNext}
                          onChange={(e) => {
                            autoReading.value = {
                              ...autoReading.value,
                              autoNext: e.currentTarget.checked,
                            };
                            saveSettings();
                          }}
                          className="w-5 h-5 accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 章节列表 */}
      {showChapterList.value && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => showChapterList.value = false}
        >
          <div
            className={`fixed left-0 top-0 bottom-0 w-80 ${getThemeClasses()} p-6 overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6">目录</h2>
            <div className="space-y-2">
              {chapters.value.map((chapter, index) => (
                <button
                  key={chapter.chapterUid}
                  onClick={async () => {
                    showChapterList.value = false;
                    if (index !== currentChapterIndex.value) {
                      await navigateToChapter(
                        index > currentChapterIndex.value ? "next" : "prev",
                      );
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === currentChapterIndex.value
                      ? "bg-blue-100 text-blue-900 font-medium"
                      : "hover:bg-current/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{chapter.title}</span>
                    {index === currentChapterIndex.value && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {chapter.wordCount && (
                    <div className="text-xs text-current/60 mt-1">
                      {chapter.wordCount} 字
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
