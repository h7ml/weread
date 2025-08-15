import { define } from "../../../utils.ts";
import WeReadStyleReaderComponent from "../../../islands/WeReadStyleReaderComponent.tsx";

export default define.page(function ReaderPage() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <link rel="stylesheet" href="/weread-reader.css" />
      <WeReadStyleReaderComponent />
    </div>
  );
});
