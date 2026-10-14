import React from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
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
  return (
    <section className="file-reader" aria-label={`${title} attachment`}>
      <div className="reader-toolbar">
        <span>{pdf ? "PDF document" : "Document attachment"}</span>
        <div>
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open file ↗
          </a>
          <a className="download-button" href={url} download>
            Download ↓
          </a>
        </div>
      </div>
      {pdf && (
        <>
          <iframe
            src={url + "#view=FitH"}
            title={title}
            className="pdf-frame"
            loading="lazy"
          />
          <p className="reader-hint">
            If the preview is unavailable on your device, use Open file or
            Download above.
          </p>
        </>
      )}
    </section>
  );
}
