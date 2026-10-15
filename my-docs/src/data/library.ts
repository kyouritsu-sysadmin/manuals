import data from "./catalog.json";

export interface Division {
  slug: string;
  name: string;
  englishName?: string;
  description: string;
  japanese: string;
  romaji: string;
  parent?: string;
}

export interface LibraryDocument {
  slug: string;
  division: string;
  category: string;
  title: string;
  description: string;
  format: "PDF" | "Guide" | "File";
  language: string;
  updated: string;
  file?: string;
  source?: string;
  sample?: boolean;
}

// The generation step validates the JSON before Docusaurus starts or builds.
const catalog = data as {
  divisions: Division[];
  categories: { slug: string; name: string }[];
  documents: LibraryDocument[];
};

export default catalog;
