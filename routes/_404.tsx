/**
 * 微信读书 Web 阅读应用 - 404错误页面
 *
 * @description 自定义404页面路由，提供友好的错误提示和导航
 * @author h7ml <h7ml@qq.com>
 * @version 1.0.0
 * @license MIT
 * @homepage https://github.com/h7ml/weread
 * @created 2025-08-15
 */

import { define } from "../utils.ts";
import NotFound404Island from "../islands/NotFound404Island.tsx";

export default define.page(function NotFoundPage() {
  return <NotFound404Island />;
});
