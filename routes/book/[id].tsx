import { define } from "../../utils.ts";
import BookDetailComponent from "../../islands/BookDetailComponent.tsx";

export default define.page(function BookDetailPage() {
  return (
    <div>
      <BookDetailComponent />
    </div>
  );
});
