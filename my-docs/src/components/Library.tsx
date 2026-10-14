import React, { useState } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import catalog from "@site/src/data/library";

type Props = { division?: string; category?: string | null };
export default function Library({ division, category }: Props) {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("all");
  const currentDivision = catalog.divisions.find(
    (item) => item.slug === division,
  );
  const currentCategory = catalog.categories.find(
    (item) => item.slug === category,
  );
  const scoped = catalog.documents.filter(
    (doc) =>
      (!division || doc.division === division) &&
      (!category || doc.category === category),
  );
  const search = query.trim().toLocaleLowerCase();
  const documents = scoped.filter(
    (doc) =>
      (format === "all" || doc.format === format) &&
      [
        doc.title,
        doc.description,
        doc.language,
        catalog.divisions.find((item) => item.slug === doc.division)?.name,
        doc.category,
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
  );
  const divisions = catalog.divisions.filter((item) =>
    [item.name, item.description]
      .join(" ")
      .toLocaleLowerCase()
      .includes(search),
  );
  const title = currentCategory
    ? currentCategory.name
    : currentDivision
      ? currentDivision.name
      : "A place for every document.";
  return (
    <Layout
      title={
        currentDivision
          ? `${currentDivision.name}${currentCategory ? " · " + currentCategory.name : ""}`
          : "Document library"
      }
      description="Find manuals, guides, and documents across Kyoritsu divisions."
    >
      <div className="library-shell">
        <aside className="library-sidebar" aria-label="Library navigation">
          <div className="sidebar-label">WORKSPACE</div>
          <Link className={`side-link ${!division ? "selected" : ""}`} to="/">
            <span>▦</span> All documents{" "}
            <span className="count">{catalog.documents.length}</span>
          </Link>
          <div className="sidebar-label division-label">
            DIVISIONS <span>{catalog.divisions.length}</span>
          </div>
          <nav>
            {catalog.divisions.map((item) => (
              <Link
                key={item.slug}
                className={`side-link ${division === item.slug ? "selected" : ""}`}
                to={`/${item.slug}/`}
                aria-current={division === item.slug ? "page" : undefined}
              >
                <span className="division-dot" />
                {item.name}
                {catalog.documents.some(
                  (doc) => doc.division === item.slug,
                ) && <span className="live-dot" />}
              </Link>
            ))}
          </nav>
          <div className="sidebar-note">
            One library.
            <br />
            Knowledge across every team.
          </div>
        </aside>
        <main className="library-main" id="library-content">
          <nav className="library-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Library</Link>
            {currentDivision && (
              <>
                <span>/</span>
                <Link to={`/${division}/`}>{currentDivision.name}</Link>
              </>
            )}
            {currentCategory && (
              <>
                <span>/</span>
                <span>{currentCategory.name}</span>
              </>
            )}
          </nav>
          <header className="library-hero">
            <div className="eyebrow">
              {currentDivision ? "DIVISION LIBRARY" : "THE KNOWLEDGE LIBRARY"}
            </div>
            <h1>{title}</h1>
            <p>
              {currentDivision
                ? currentDivision.description
                : "Find the guidance you need. Manuals, resources, and shared knowledge — organized by the teams behind them."}
            </p>
            {!division && (
              <div className="library-stats">
                <span>
                  <strong>{catalog.divisions.length}</strong> divisions
                </span>
                <span>
                  <strong>{catalog.documents.length}</strong> documents
                </span>
                <span className="status-label">
                  <i /> One shared library
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
                Search document titles, descriptions, and divisions
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  division
                    ? "Search this division…"
                    : "Search documents or divisions…"
                }
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </label>
            <label className="format-select">
              <span className="sr-only">Document format</span>
              <select
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                <option value="all">All formats</option>
                <option value="PDF">PDF</option>
                <option value="Guide">Guides</option>
                <option value="File">Files</option>
              </select>
            </label>
          </div>
          {division && (
            <nav className="category-tabs" aria-label="Document categories">
              <Link className={!category ? "active" : ""} to={`/${division}/`}>
                All documents
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
                  ? "Search results"
                  : currentCategory
                    ? currentCategory.name
                    : "Documents"}{" "}
                <span>{documents.length}</span>
              </h2>
              <span className="section-caption">
                {division ? currentDivision?.name : "Across your workspace"}
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
                      {doc.sample && <span className="sample-tag">Sample</span>}
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
                    <span className="format-badge">{doc.format}</span>
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
                      ? "No matching documents"
                      : "A home for your team’s knowledge"}
                  </h3>
                  <p>
                    {query || format !== "all"
                      ? "Try another search or select a different format."
                      : "There are no documents here yet. Published resources will appear in this space."}
                  </p>
                  {(query || format !== "all") && (
                    <button
                      className="button button--secondary"
                      onClick={() => {
                        setQuery("");
                        setFormat("all");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
          {!division && (
            <section className="divisions-section" aria-labelledby="divisions">
              <div className="section-title">
                <Heading as="h2" id="divisions">
                  Browse divisions <span>{divisions.length}</span>
                </Heading>
                <span className="section-caption">Find your team’s space</span>
              </div>
              <div className="division-grid">
                {divisions.map((item) => {
                  const count = catalog.documents.filter(
                    (doc) => doc.division === item.slug,
                  ).length;
                  return (
                    <Link
                      className="division-card"
                      key={item.slug}
                      to={`/${item.slug}/`}
                    >
                      <div className="division-card-top">
                        <span className="division-monogram">
                          {item.slug === "sales" ? "SA" : item.slug.slice(-2)}
                        </span>
                        <span aria-hidden="true">↗</span>
                      </div>
                      <h3>{item.name}</h3>
                      <p>
                        {item.placeholder
                          ? "Division name to be configured"
                          : item.description}
                      </p>
                      <span className="division-card-count">
                        {count ? `${count} documents` : "No documents yet"}
                      </span>
                    </Link>
                  );
                })}
              </div>
              {!divisions.length && (
                <p className="muted">No divisions match your search.</p>
              )}
            </section>
          )}
          <div className="library-footnote">
            Organized by division. Built for everyday reference.
          </div>
        </main>
      </div>
    </Layout>
  );
}
