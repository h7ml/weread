/**
 * 微信读书 Web 阅读应用 - 工具函数
 * 
 * @description Fresh 兼容性工具和页面定义助手
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { PageProps } from "$fresh/server.ts";

export interface State {
  title: string;
}

// Simple helper for page definitions that matches the original define.page pattern
export const define = {
  page: (component: (props: PageProps<unknown, State>) => any) => component,
};
