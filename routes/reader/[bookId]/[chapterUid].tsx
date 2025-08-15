import { define } from "../../../utils.ts";
import WeReadStyleReaderComponent from "../../../islands/WeReadStyleReaderComponent.tsx";

export default define.page(function ReaderPage() {
  return (
    <>
      <link rel="stylesheet" href="/weread-reader.css" />
      <div>
        <WeReadStyleReaderComponent />
      </div>
    </>
  );
});
