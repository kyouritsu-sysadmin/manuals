import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";
import catalog from "./src/data/library";
import { divisionTrail } from "./src/data/hierarchy";
const sidebars: SidebarsConfig = {};
for (const division of catalog.divisions) {
  const documents = catalog.documents.filter(
    (doc) => doc.division === division.slug,
  );
  if (!documents.length) continue;
  sidebars[division.slug] = [
    { type: "link", label: "← All divisions", href: "/", autoAddBaseUrl: true },
    ...divisionTrail(catalog.divisions, division.slug).map((item) => ({
      type: "link" as const,
      label: `${item.name} overview`,
      href: `/${item.slug}/`,
      autoAddBaseUrl: true,
    })),
    ...catalog.categories
      .filter((category) =>
        documents.some((doc) => doc.category === category.slug),
      )
      .map((category) => ({
        type: "category" as const,
        label: category.name,
        collapsed: false,
        items: documents
          .filter((doc) => doc.category === category.slug)
          .map((doc) => `${division.slug}/${category.slug}/${doc.slug}`),
      })),
  ];
}
export default sidebars;
