#!/usr/bin/env -S deno run -A --watch=static/,routes/

/**
 * 微信读书 Web 阅读应用 - 开发服务器
 * 
 * @description 开发环境启动文件，提供热重载功能
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts");
