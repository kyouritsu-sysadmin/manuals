import React, { useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import FlipbookReader from "./FlipbookReader";
import useLibraryLocale from "./useLibraryLocale";

export default function DocumentFile({
  path,
  title,
  pdf = false,
}: {
  path: string;
  title: string;
  pdf?: boolean;
}) {
  const url = useBaseUrl("/" + path);
  const { t } = useLibraryLocale();
  const [mode, setMode] = useState<"book" | "standard">("book");
  const [page, setPage] = useState(1);
  return (
    <section className="file-reader" aria-label={title}>
      <div className="reader-toolbar">
        <span>{t(pdf ? "PDF document" : "Document attachment")}</span>
        <div className="reader-actions">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {t("Open file ↗")}
          </a>
          <a className="download-button" href={url} download>
            {t("Download ↓")}
          </a>
        </div>
      </div>
      {pdf && (
        <>
          <div
            className="reader-modes"
            role="group"
            aria-label={t("PDF document")}
          >
            <button
              type="button"
              aria-pressed={mode === "book"}
              onClick={() => setMode("book")}
            >
              {t("Flipbook")}
            </button>
            <button
              type="button"
              aria-pressed={mode === "standard"}
              onClick={() => setMode("standard")}
            >
              {t("Standard PDF")}
            </button>
          </div>
          {mode === "book" ? (
            <FlipbookReader
              key={url}
              url={url}
              title={title}
              initialPage={page}
              onPageChange={setPage}
            />
          ) : (
            <iframe
              src={`${url}#page=${page}&view=FitH`}
              title={title}
              className="pdf-frame"
            />
          )}
          <p className="reader-hint">
            {t(
              mode === "book"
                ? "Use Standard PDF for text selection, search, and printing."
                : "If the preview is unavailable on your device, use Open file or Download above.",
            )}
          </p>
        </>
      )}
    </section>
  );
}
