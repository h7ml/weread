import { define } from "../utils.ts";
import NotFound404Island from "../islands/NotFound404Island.tsx";

export default define.page(function NotFoundPage() {
  return <NotFound404Island />;
});
