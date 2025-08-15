/**
 * 微信读书 Web 阅读应用 - Fresh 配置
 * 
 * @description Fresh 框架配置文件，设置构建目标和其他选项
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { defineConfig } from "$fresh/server.ts";

export default defineConfig({
  build: {
    target: ["chrome99", "firefox99", "safari15"],
  },
});
