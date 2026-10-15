import React, { useState } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import useLibraryLocale from "./useLibraryLocale";
import type { Division } from "../data/library";
import {
  divisionTrail,
  withinDivision,
  normalizeSearch,
  divisionMatches,
} from "../data/hierarchy";

type Props = { division?: string; category?: string | null };
export default function Library({ division, category }: Props) {
  const { t, catalog } = useLibraryLocale();
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("all");
  const currentDivision = catalog.divisions.find(
    (item) => item.slug === division,
  );
  const currentCategory = catalog.categories.find(
    (item) => item.slug === category,
  );
  const trail = divisionTrail(catalog.divisions, division);
  const childrenOf = (slug?: string) =>
    catalog.divisions.filter((item) => item.parent === slug);
  const countDocuments = (slug: string) =>
    catalog.documents.filter((doc) =>
      withinDivision(catalog.divisions, doc.division, slug),
    ).length;
  const scoped = catalog.documents.filter(
    (doc) =>
      withinDivision(catalog.divisions, doc.division, division) &&
      (!category || doc.category === category),
  );
  const search = normalizeSearch(query.trim());
  const documents = scoped.filter(
    (doc) =>
      (format === "all" || doc.format === format) &&
      normalizeSearch(
        [
          doc.title,
          doc.description,
          doc.language,
          ...divisionTrail(catalog.divisions, doc.division).flatMap((item) => [
            item.name,
            item.englishName || "",
            item.japanese,
            item.romaji,
          ]),
          doc.category,
        ].join(" "),
      ).includes(search),
  );
  const matchesBranch = (item: Division): boolean =>
    divisionMatches(item, search) || childrenOf(item.slug).some(matchesBranch);
  const divisions = childrenOf(division).filter(matchesBranch);
  function divisionLinks(items: Division[], filtered = false) {
    return (
      <ul className="division-tree">
        {items
          .filter((item) => !filtered || matchesBranch(item))
          .map((item) => (
            <li key={item.slug}>
              <Link
                className={`side-link ${division === item.slug ? "selected" : ""}`}
                to={`/${item.slug}/`}
                aria-current={division === item.slug ? "page" : undefined}
              >
                <span className="division-dot" aria-hidden="true" />
                <span>{item.name}</span>
                {countDocuments(item.slug) > 0 && (
                  <span className="live-dot" aria-hidden="true" />
                )}
              </Link>
              {childrenOf(item.slug).length > 0 &&
                divisionLinks(
                  childrenOf(item.slug),
                  filtered && !divisionMatches(item, search),
                )}
            </li>
          ))}
      </ul>
    );
  }
  const title = currentCategory
    ? currentCategory.name
    : currentDivision
      ? currentDivision.name
      : t("A place for every document.");
  return (
    <Layout
      title={
        currentDivision
          ? `${currentDivision.name}${currentCategory ? " · " + currentCategory.name : ""}`
          : t("Document library")
      }
      description={t(
        "Find manuals, guides, and documents across Kyoritsu divisions.",
      )}
    >
      <div className="library-shell">
        <aside className="library-sidebar" aria-label={t("Library navigation")}>
          <div className="sidebar-label">{t("WORKSPACE")}</div>
          <Link className={`side-link ${!division ? "selected" : ""}`} to="/">
            <span>▦</span> {t("All documents")}{" "}
            <span className="count">{catalog.documents.length}</span>
          </Link>
          <div className="sidebar-label division-label">
            {t("DIVISIONS")} <span>{catalog.divisions.length}</span>
          </div>
          <nav>{divisionLinks(childrenOf())}</nav>
          <div className="sidebar-note">
            {t("One library.")}
            <br />
            {t("Knowledge across every team.")}
          </div>
        </aside>
        <main className="library-main" id="library-content">
          <nav className="library-breadcrumb" aria-label={t("Breadcrumb")}>
            <Link to="/">{t("Library")}</Link>
            {trail.map((item) => (
              <React.Fragment key={item.slug}>
                <span>/</span>
                <Link to={`/${item.slug}/`}>{item.name}</Link>
              </React.Fragment>
            ))}
            {currentCategory && (
              <>
                <span>/</span>
                <span>{currentCategory.name}</span>
              </>
            )}
          </nav>
          <header className="library-hero">
            <div className="eyebrow">
              {currentDivision
                ? t("DIVISION LIBRARY")
                : t("THE KNOWLEDGE LIBRARY")}
            </div>
            <h1>{title}</h1>
            {currentDivision && (
              <p className="division-romaji" lang="en">
                {currentDivision.romaji}
              </p>
            )}
            <p>
              {currentDivision
                ? currentDivision.description
                : t(
                    "Find the guidance you need. Manuals, resources, and shared knowledge — organized by the teams behind them.",
                  )}
            </p>
            {!division && (
              <div className="library-stats">
                <span>
                  <strong>{catalog.divisions.length}</strong>{" "}
                  {t("departments and sections")}
                </span>
                <span>
                  <strong>{catalog.documents.length}</strong> {t("documents")}
                </span>
                <span className="status-label">
                  <i /> {t("One shared library")}
                </span>
              </div>
            )}
          </header>
          <div className="search-row">
            <label className="search-box">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
              <span className="sr-only">
                {t("Search document titles, descriptions, and divisions")}
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  division
                    ? t("Search this division…")
                    : t("Search documents or divisions…")
                }
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label={t("Clear search")}
                >
                  ×
                </button>
              )}
            </label>
            <label className="format-select">
              <span className="sr-only">{t("Document format")}</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                <option value="all">{t("All formats")}</option>
                <option value="PDF">PDF</option>
                <option value="Guide">{t("Guides")}</option>
                <option value="File">{t("Files")}</option>
              </select>
            </label>
          </div>
          {division && (
            <nav
              className="category-tabs"
              aria-label={t("Document categories")}
            >
              <Link className={!category ? "active" : ""} to={`/${division}/`}>
                {t("All documents")}
              </Link>
              {catalog.categories.map((item) => (
                <Link
                  className={category === item.slug ? "active" : ""}
                  key={item.slug}
                  to={`/${division}/${item.slug}/`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}
          <section
            className="documents-section"
            aria-labelledby="documents-heading"
          >
            <div className="section-title">
              <h2 id="documents-heading">
                {search
                  ? t("Search results")
                  : currentCategory
                    ? currentCategory.name
                    : t("Documents")}{" "}
                <span>{documents.length}</span>
              </h2>
              <span className="section-caption">
                {division
                  ? childrenOf(division).length
                    ? t("Includes section documents")
                    : currentDivision?.name
                  : t("Across your workspace")}
              </span>
            </div>
            <div className="document-list" aria-live="polite">
              {documents.map((doc) => (
                <Link
                  className="document-row"
                  key={`${doc.division}/${doc.category}/${doc.slug}`}
                  to={`/${doc.division}/${doc.category}/${doc.slug}/`}
                >
                  <span
                    className={`file-icon ${doc.format === "PDF" ? "pdf" : ""}`}
                    aria-hidden="true"
                  >
                    <svg
                      width="24"
                      height="28"
                      viewBox="0 0 24 28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    >
                      <path d="M5 2h9l5 5v19H5z" />
                      <path d="M14 2v6h5M8 14h8M8 18h8" />
                    </svg>
                  </span>
                  <span className="document-info">
                    <span className="document-title">
                      {doc.title}
                      {doc.sample && (
                        <span className="sample-tag">{t("Sample")}</span>
                      )}
                    </span>
                    <span className="document-description">
                      {doc.description}
                    </span>
                    <span className="document-tags">
                      {
                        catalog.divisions.find(
                          (item) => item.slug === doc.division,
                        )?.name
                      }
                      <span> / </span>
                      {
                        catalog.categories.find(
                          (item) => item.slug === doc.category,
                        )?.name
                      }
                      <span> · </span>
                      {doc.language}
                    </span>
                  </span>
                  <span className="document-date">
                    <span className="format-badge">{t(doc.format)}</span>
                    <time dateTime={doc.updated}>{doc.updated}</time>
                  </span>
                  <span className="row-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ))}
              {!documents.length && (
                <div className="empty-state">
                  <span aria-hidden="true">▤</span>
                  <h3>
                    {query || format !== "all"
                      ? t("No matching documents")
                      : t("A home for your team’s knowledge")}
                  </h3>
                  <p>
                    {query || format !== "all"
                      ? t("Try another search or select a different format.")
                      : t(
                          "There are no documents here yet. Published resources will appear in this space.",
                        )}
                  </p>
                  {(query || format !== "all") && (
                    <button
                      className="button button--secondary"
                      onClick={() => {
                        setQuery("");
                        setFormat("all");
                      }}
                    >
                      {t("Clear filters")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
          {(!division || childrenOf(division).length > 0) && (
            <section className="divisions-section" aria-labelledby="divisions">
              <div className="section-title">
                <Heading as="h2" id="divisions">
                  {t(division ? "Sections" : "Browse divisions")}{" "}
                  <span>{divisions.length}</span>
                </Heading>
                <span className="section-caption">
                  {t("Find your team’s space")}
                </span>
              </div>
              <div className="division-grid">
                {divisions.map((item) => {
                  const count = countDocuments(item.slug);
                  return (
                    <article className="division-card" key={item.slug}>
                      <Link
                        className="division-card-link"
                        to={`/${item.slug}/`}
                      >
                        <div className="division-card-top">
                          <span className="division-monogram">
                            {item.slug === "sales"
                              ? "SA"
                              : item.slug.slice(0, 2).toUpperCase()}
                          </span>
                          <span aria-hidden="true">↗</span>
                        </div>
                        <h3>{item.name}</h3>
                        <span className="division-romaji" lang="en">
                          {item.romaji}
                        </span>
                        <p>{item.description}</p>
                      </Link>
                      {childrenOf(item.slug).length > 0 &&
                        divisionLinks(
                          childrenOf(item.slug),
                          !divisionMatches(item, search),
                        )}
                      <span className="division-card-count">
                        {count
                          ? `${count} ${t("documents")}`
                          : t("No documents yet")}
                      </span>
                    </article>
                  );
                })}
              </div>
              {!divisions.length && (
                <p className="muted">{t("No divisions match your search.")}</p>
              )}
            </section>
          )}
          <div className="library-footnote">
            {t("Organized by division. Built for everyday reference.")}
          </div>
        </main>
      </div>
    </Layout>
  );
}
