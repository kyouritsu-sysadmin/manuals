import React, { useEffect, useRef, useState } from "react";
import useBaseUrl from "@docusaurus/useBaseUrl";
import type { PageFlip } from "page-flip";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import useLibraryLocale from "./useLibraryLocale";

type Props = {
  url: string;
  title: string;
  initialPage: number;
  onPageChange: (page: number) => void;
};

export default function FlipbookReader({
  url,
  title,
  initialPage,
  onPageChange,
}: Props) {
  const { t } = useLibraryLocale();
  const assets = useBaseUrl("/vendor/pdfjs/");
  const container = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const engine = useRef<PageFlip | null>(null);
  const initial = useRef(initialPage);
  const onChange = useRef(onPageChange);
  onChange.current = onPageChange;
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [entry, setEntry] = useState(String(initialPage));
  const [zoom, setZoom] = useState(1);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [orientation, setOrientation] = useState("portrait");
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    if (!mount.current) return;
    let cancelled = false;
    let loading: PDFDocumentLoadingTask | undefined;
    let book: PageFlip | undefined;
    let observer: ResizeObserver | undefined;
    const tasks = new Set<RenderTask>();
    const images = new Map<number, string>();
    const pending = new Map<number, Promise<void>>();
    const nodes: HTMLElement[] = [];
    let active = initial.current - 1;
    const host = document.createElement("div");
    host.className = "flipbook";
    mount.current.appendChild(host);
    setError(false);
    setReady(false);
    async function start() {
      const [pdfjs, flip] = await Promise.all([
        import("pdfjs-dist"),
        import("page-flip"),
      ]);
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = assets + "pdf.worker.min.mjs";
      loading = pdfjs.getDocument({
        url,
        cMapUrl: assets + "cmaps/",
        cMapPacked: true,
        standardFontDataUrl: assets + "standard_fonts/",
        wasmUrl: assets + "wasm/",
        iccUrl: assets + "iccs/",
      });
      const documentPdf = await loading.promise;
      if (cancelled) return;
      active = Math.max(0, Math.min(active, documentPdf.numPages - 1));
      setTotal(documentPdf.numPages);
      setPdf(documentPdf);
      const first = await documentPdf.getPage(1);
      if (cancelled) return;
      const dimensions = first.getViewport({ scale: 1 });
      for (let index = 0; index < documentPdf.numPages; index++) {
        const node = document.createElement("div");
        node.className = "flipbook-page";
        const placeholder = document.createElement("span");
        placeholder.className = "flipbook-placeholder";
        placeholder.textContent = `${t("Page")} ${index + 1} · ${t("Loading page…")}`;
        const image = document.createElement("img");
        image.alt = `${title} · ${t("Page")} ${index + 1}`;
        image.draggable = false;
        image.hidden = true;
        node.append(placeholder, image);
        host.appendChild(node);
        nodes.push(node);
      }
      async function renderPage(index: number): Promise<void> {
        if (
          cancelled ||
          index < 0 ||
          index >= nodes.length ||
          images.has(index)
        )
          return;
        const existing = pending.get(index);
        if (existing) return existing;
        const job = (async () => {
          const pdfPage = await documentPdf.getPage(index + 1);
          if (cancelled) return;
          const size = pdfPage.getViewport({ scale: 1 });
          // Bound each bitmap and retain only the nearby spread, even for long manuals.
          const viewport = pdfPage.getViewport({
            scale: Math.min(1600 / size.width, 2000 / size.height),
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const task = pdfPage.render({ canvas, viewport });
          tasks.add(task);
          try {
            await task.promise;
          } finally {
            tasks.delete(task);
          }
          if (cancelled) return;
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/webp", 0.92),
          );
          canvas.width = 1;
          canvas.height = 1;
          if (!blob || cancelled || Math.abs(index - active) > 6) return;
          const source = URL.createObjectURL(blob);
          images.set(index, source);
          const img = nodes[index].querySelector("img")!;
          img.src = source;
          img.hidden = false;
          nodes[index].querySelector<HTMLElement>(
            ".flipbook-placeholder",
          )!.hidden = true;
        })();
        pending.set(index, job);
        try {
          await job;
        } finally {
          pending.delete(index);
        }
      }
      async function renderAround(index: number) {
        active = index;
        for (const [number, source] of images) {
          if (Math.abs(number - active) > 6) {
            const img = nodes[number].querySelector("img")!;
            img.hidden = true;
            img.removeAttribute("src");
            nodes[number].querySelector<HTMLElement>(
              ".flipbook-placeholder",
            )!.hidden = false;
            URL.revokeObjectURL(source);
            images.delete(number);
          }
        }
        // Render the visible spread first, then its neighbors, without rendering the entire PDF.
        for (const offset of [0, 1, -1, 2, -2, 3]) {
          if (cancelled || active !== index) return;
          await renderPage(index + offset);
        }
      }
      await renderPage(active);
      await renderPage(active + 1);
      if (cancelled) return;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      book = new flip.PageFlip(host, {
        width: 460,
        height: Math.round((460 * dimensions.height) / dimensions.width),
        size: "stretch",
        minWidth: 240,
        maxWidth: 1000,
        minHeight: 300,
        maxHeight: 1500,
        showCover: true,
        usePortrait: true,
        autoSize: true,
        maxShadowOpacity: 0.22,
        flippingTime: reducedMotion ? 1 : 550,
        showPageCorners: !reducedMotion,
        mobileScrollSupport: true,
        startPage: active,
      });
      engine.current = book;
      book.on("flip", (event) => {
        const index = Number(event.data);
        setPage(index + 1);
        setEntry(String(index + 1));
        onChange.current(index + 1);
        void renderAround(index).catch(() => {
          if (!cancelled) setError(true);
        });
      });
      book.on("changeOrientation", (event) =>
        setOrientation(String(event.data)),
      );
      book.loadFromHTML(nodes);
      setOrientation(book.getOrientation());
      setPage(active + 1);
      setEntry(String(active + 1));
      setReady(true);
      observer = new ResizeObserver(() => book?.update());
      observer.observe(mount.current!);
      void renderAround(active).catch(() => {
        if (!cancelled) setError(true);
      });
    }
    void start().catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      observer?.disconnect();
      tasks.forEach((task) => task.cancel());
      book?.destroy();
      engine.current = null;
      host.remove();
      images.forEach((source) => URL.revokeObjectURL(source));
      void loading?.destroy();
    };
  }, [url, assets, t, title]);

  useEffect(() => {
    const update = () =>
      setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  function goTo(value: number) {
    const next = Math.max(
      1,
      Math.min(total, Number.isFinite(value) ? value : page),
    );
    engine.current?.turnToPage(next - 1);
    setEntry(String(next));
  }
  const lastVisible =
    orientation === "landscape" && page > 1 ? Math.min(page + 1, total) : page;
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    container.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
      if (event.key === "Tab") {
        const controls = Array.from(
          container.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
          ) || [],
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === container.current)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [expanded]);
  async function toggleFullscreen() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (container.current?.requestFullscreen)
        await container.current.requestFullscreen();
      else setExpanded(true);
    } catch {
      setExpanded(true);
    }
  }
  return (
    <div
      className={`flipbook-reader ${expanded ? "flipbook-expanded" : ""}`}
      ref={container}
      tabIndex={-1}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? t("Flipbook") : undefined}
    >
      <div
        className="flipbook-controls"
        role="group"
        aria-label={t("Flipbook")}
      >
        <button
          type="button"
          disabled={!ready || error}
          aria-expanded={pagesOpen}
          onClick={() => setPagesOpen(!pagesOpen)}
        >
          {t("Pages")}
        </button>
        <button
          type="button"
          disabled={!ready || page <= 1 || error}
          aria-label={t("Previous page")}
          onClick={() => engine.current?.flipPrev()}
        >
          ←
        </button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            goTo(Number(entry));
          }}
        >
          <label>
            {t("Page")}{" "}
            <input
              aria-label={t("Page")}
              type="number"
              min={1}
              max={total || 1}
              value={entry}
              disabled={!ready || error}
              onChange={(event) => setEntry(event.target.value)}
            />
          </label>
          <span> / {total || "—"}</span>
          <button type="submit" disabled={!ready || error}>
            {t("Go")}
          </button>
        </form>
        <button
          type="button"
          disabled={!ready || lastVisible >= total || error}
          aria-label={t("Next page")}
          onClick={() => engine.current?.flipNext()}
        >
          →
        </button>
        <span className="flipbook-control-spacer" />
        <button
          type="button"
          disabled={zoom <= 0.75}
          aria-label={t("Zoom out")}
          onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
        >
          −
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          type="button"
          disabled={zoom >= 2}
          aria-label={t("Zoom in")}
          onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
        >
          +
        </button>
        <button type="button" onClick={() => setZoom(1)}>
          {t("Fit")}
        </button>
        <button type="button" onClick={toggleFullscreen}>
          {t(fullscreen || expanded ? "Exit fullscreen" : "Fullscreen")}
        </button>
      </div>
      {error && (
        <p role="alert" className="flipbook-error">
          {t(
            "Unable to load the flipbook. Use Standard PDF or open the original file.",
          )}
        </p>
      )}
      {!ready && !error && (
        <p role="status" className="flipbook-loading">
          {t("Loading document…")}
        </p>
      )}
      <div className="flipbook-body" hidden={error}>
        {pagesOpen && pdf && (
          <nav className="flipbook-thumbnails" aria-label={t("Pages")}>
            {Array.from({ length: total }, (_, index) => (
              <Thumbnail
                key={index}
                pdf={pdf}
                number={index + 1}
                label={`${t("Page")} ${index + 1}`}
                active={index + 1 >= page && index + 1 <= lastVisible}
                onClick={() => goTo(index + 1)}
              />
            ))}
          </nav>
        )}
        <div
          className="flipbook-scroll"
          tabIndex={0}
          role="region"
          aria-label={`${title} · ${t("Flipbook")}`}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget || !ready) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              engine.current?.flipPrev();
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              engine.current?.flipNext();
            }
            if (event.key === "Home") {
              event.preventDefault();
              goTo(1);
            }
            if (event.key === "End") {
              event.preventDefault();
              goTo(total);
            }
          }}
        >
          <div className="flipbook-sizing" style={{ width: `${zoom * 100}%` }}>
            <div
              ref={mount}
              className="flipbook-mount"
              style={{ visibility: ready ? "visible" : "hidden" }}
            />
          </div>
        </div>
      </div>
      <p className="reader-hint" aria-live="polite">
        {ready
          ? `${t("Page")} ${page}${lastVisible > page ? "–" + lastVisible : ""} / ${total}. `
          : ""}
        {t(
          "Turn pages with the arrows, page corners, or left/right keys while the book is focused.",
        )}
      </p>
    </div>
  );
}

function Thumbnail({
  pdf,
  number,
  label,
  active,
  onClick,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    let task: RenderTask | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void pdf
          .getPage(number)
          .then(async (page) => {
            if (cancelled || !canvas.current) return;
            const viewport = page.getViewport({
              scale: 110 / page.getViewport({ scale: 1 }).width,
            });
            canvas.current.width = Math.ceil(viewport.width);
            canvas.current.height = Math.ceil(viewport.height);
            task = page.render({ canvas: canvas.current, viewport });
            await task.promise;
          })
          .catch(() => {
            /* The numbered page button remains usable if its preview fails. */
          });
      },
      { root: button.current?.parentElement, rootMargin: "120px" },
    );
    observer.observe(button.current!);
    return () => {
      cancelled = true;
      observer.disconnect();
      task?.cancel();
    };
  }, [pdf, number]);
  return (
    <button
      type="button"
      ref={button}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <canvas ref={canvas} aria-hidden="true" />
      <span>{number}</span>
    </button>
  );
}
