/** @jsx h */
import { h } from "preact";
import { define } from "../utils.ts";
import ShelfComponent from "../islands/ShelfComponent.tsx";

export default define.page(function ShelfPage() {
  return (
    <div>
      <ShelfComponent />
    </div>
  );
});
