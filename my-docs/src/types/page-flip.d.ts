declare module "page-flip" {
  export class PageFlip {
    constructor(
      element: HTMLElement,
      settings: Record<string, number | string | boolean>,
    );
    loadFromHTML(pages: HTMLElement[]): void;
    flip(page: number): void;
    flipNext(): void;
    flipPrev(): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getOrientation(): "portrait" | "landscape";
    update(): void;
    destroy(): void;
    on(event: string, callback: (event: { data: unknown }) => void): PageFlip;
  }
}
