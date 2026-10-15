import { useCallback, useMemo } from "react";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import source from "@site/src/data/library";
import japanese from "@site/src/data/locales/ja.json";
export default function useLibraryLocale() {
  const { i18n } = useDocusaurusContext();
  const ja = i18n.currentLocale === "ja";
  const t = useCallback(
    (message: string) =>
      ja
        ? (japanese.ui as Record<string, string>)[message] || message
        : message,
    [ja],
  );
  const catalog = useMemo(() => {
    if (!ja) return source;
    const divisions = japanese.divisions as Record<
      string,
      { name: string; description: string }
    >;
    const categories = japanese.categories as Record<string, { name: string }>;
    const documents = japanese.documents as Record<
      string,
      Partial<(typeof source.documents)[number]>
    >;
    return {
      divisions: source.divisions.map((item) => ({
        ...item,
        ...divisions[item.slug],
      })),
      categories: source.categories.map((item) => ({
        ...item,
        ...categories[item.slug],
      })),
      documents: source.documents.map((item) => ({
        ...item,
        ...documents[`${item.division}/${item.category}/${item.slug}`],
      })),
    };
  }, [ja]);
  return { t, catalog, ja };
}
