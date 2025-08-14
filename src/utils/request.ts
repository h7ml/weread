// deno-lint-ignore-file no-explicit-any
import { logger } from "./logger.ts";

export interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: any;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private defaultTimeout: number;

  constructor(baseURL = "", defaultHeaders: HeadersInit = {}, defaultTimeout = 30000) {
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * 发送HTTP请求
   */
  async request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 0,
      retryDelay = 1000,
    } = options;

    const fullURL = this.baseURL ? new URL(url, this.baseURL).toString() : url;
    
    const requestHeaders = new Headers({
      ...this.defaultHeaders,
      ...headers,
    });

    // 自动设置Content-Type
    if (body && !requestHeaders.has("Content-Type")) {
      if (typeof body === "object" && !(body instanceof FormData)) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }

    const requestBody = body instanceof FormData 
      ? body 
      : typeof body === "object" 
        ? JSON.stringify(body) 
        : body;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt} for ${fullURL}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }

        const response = await fetch(fullURL, {
          method,
          headers: requestHeaders,
          body: method !== "GET" && method !== "HEAD" ? requestBody : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get("Content-Type") || "";
        
        if (contentType.includes("application/json")) {
          return await response.json();
        } else if (contentType.includes("text/")) {
          return await response.text() as T;
        } else {
          return await response.arrayBuffer() as T;
        }
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && error.name === "AbortError") {
          lastError = new Error(`Request timeout after ${timeout}ms`);
        }
        
        if (attempt === retries) {
          logger.error(`Request failed after ${retries + 1} attempts: ${fullURL}`, lastError.message);
          throw lastError;
        }
      }
    }

    throw lastError || new Error("Unknown error");
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, body?: any, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(url, { ...options, method: "POST", body });
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, body?: any, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(url, { ...options, method: "PUT", body });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

/**
 * 创建微信读书API客户端
 */
export function createWeReadClient(): HttpClient {
  return new HttpClient("https://weread.qq.com", {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Referer": "https://weread.qq.com/",
    "Accept": "application/json, text/plain, */*",
  });
}

/**
 * 处理表单数据
 */
export function buildFormData(data: Record<string, any>): FormData {
  const formData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File || value instanceof Blob) {
        formData.append(key, value);
      } else if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });
  
  return formData;
}

/**
 * 构建URL查询参数
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
}