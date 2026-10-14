import React from "react";
import Library from "@site/src/components/Library";
export default function Division({
  selection,
}: {
  selection: { division: string; category: string | null };
}) {
  return <Library {...selection} />;
}
