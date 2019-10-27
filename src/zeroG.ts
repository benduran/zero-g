
import { toPx } from './util';

enum Orientation {
  Landscape,
  Portrait,
  Square,
}

export interface IPannerOptions {
  changeCursorOnPan?: boolean;
  disabled?: boolean;
  refitOnResize?: boolean;

  onScaleChange?: (currentScale: number) => void;
  onPanEnd?: (panEvent: IPanEvent, instance: ZeroGInstance) => void;
  onPanMove?: (panEvent: IPanEvent, instance: ZeroGInstance) => void;
  onPanStart?: (panEvent: IPanEvent, instance: ZeroGInstance) => void;
}

const defaultPannerOptions: IPannerOptions = {
  changeCursorOnPan: true,
  disabled: false,
  refitOnResize: true,

  onScaleChange: (currentScale: number) => undefined,
  onPanEnd: (panEvent: IPanEvent, instance: ZeroGInstance) => undefined,
  onPanMove: (panEvent: IPanEvent, instance: ZeroGInstance) => undefined,
  onPanStart: (panEvent: IPanEvent, instance: ZeroGInstance) => undefined,
};

const allowedPannerOptionKeys = Object.keys(defaultPannerOptions);

export class ZeroGInstance {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private zoom: number | null = null;
  private mousedown: boolean = false;
  private windowResizeTimeout: any;

  private naturalHeight: number;
  private naturalWidth: number;
  private orientation: Orientation;
  private parent: HTMLElement;
  private options: IPannerOptions;

  constructor(private element: HTMLElement, options: IPannerOptions = defaultPannerOptions) {
    this.options = { ...defaultPannerOptions, ...options };
    this.init();
  }

  private get currentScale(): number {
    return Math.min(this.element.clientHeight / this.naturalHeight, this.element.clientWidth / this.naturalWidth);
  }

  private bindHandlers() {
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('dragstart', this.preventDrag);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    if (this.options.refitOnResize) window.addEventListener('resize', this.handleWindowResize);
  }

  private unbindHandlers() {
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  private init() {
    this.parent = this.element.parentElement!;
    if (this.element instanceof HTMLImageElement) {
      this.naturalHeight = this.element.naturalHeight;
      this.naturalWidth = this.element.naturalWidth;
    } else if (this.element instanceof HTMLVideoElement) {
      this.naturalHeight = this.element.videoHeight;
      this.naturalWidth = this.element.videoWidth;
    } else {
      this.naturalHeight = this.element.clientHeight;
      this.naturalWidth = this.element.clientWidth;
    }
    if (this.naturalWidth > this.naturalHeight) this.orientation = Orientation.Landscape;
    else if (this.naturalHeight > this.naturalWidth) this.orientation = Orientation.Portrait;
    else this.orientation = Orientation.Square;
    this.element.style.position = 'absolute';
    this.element.style.willChange = 'top, left, width, height';
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
    this.bindHandlers();
  }

  private fitLandscape() {
    this.element.style.width = '100%';
    this.element.style.height = 'auto';
    this.element.style.left = toPx(0);
    this.element.style.top = toPx((this.parent.clientHeight - this.element.clientHeight) / 2);
  }

  private fitPortrait() {
    this.element.style.width = 'auto';
    this.element.style.height = '100%';
    this.element.style.left = toPx((this.parent.clientWidth - this.element.clientWidth) / 2);
    this.element.style.top = toPx(0);
  }

  private adjustIfOverflown() {
    if (this.element.clientHeight > this.parent.clientHeight) return this.fitPortrait();
    if (this.element.clientWidth > this.parent.clientWidth) return this.fitLandscape();
  }

  private swapMouseCursor() {
    if (this.mousedown) this.element.style.cursor = 'grabbing';
    else this.element.style.cursor = 'grab';
  }

  private doPan(pageX: number, pageY: number) {
    const deltaX = this.lastX !== null ? pageX - this.lastX : 0;
    const deltaY = this.lastY !== null ? pageY - this.lastY : 0;
    this.element.style.top = toPx(this.element.offsetTop + deltaY);
    this.element.style.left = toPx(this.element.offsetLeft + deltaX);
    this.lastX = pageX;
    this.lastY = pageY;
  }

  private preventDrag = (e: DragEvent) => {
    e.preventDefault();
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.mousedown = true;
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
    if (this.options.onPanStart) this.options.onPanStart({ lastX: null, lastY: null, x: e.pageX, y: e.pageY }, this);
  }

  private handleMouseUp = (e: MouseEvent) => {
    if (this.options.onPanEnd) this.options.onPanEnd({ lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY }, this);
    this.clearLast();
    this.mousedown = false;
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.mousedown) {
      if (this.options.onPanMove) this.options.onPanMove({ lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY }, this);
      this.doPan(e.pageX, e.pageY);
    }
  }

  private handleWindowResize = () => {
    if (this.windowResizeTimeout) this.windowResizeTimeout = clearTimeout(this.windowResizeTimeout);
    this.windowResizeTimeout = setTimeout(() => this.zoomFit(), 1);
  }

  private fit() {
    switch (this.orientation) {
      case Orientation.Landscape:
        this.fitLandscape();
        break;
      case Orientation.Portrait:
        this.fitPortrait();
        break;
      case Orientation.Square:
        this.fitLandscape();
        break;
      default:
        break;
    }
    this.adjustIfOverflown();
    if (this.options.onScaleChange) this.options.onScaleChange(this.currentScale);
  }

  destroy() {
    this.unbindHandlers();
  }

  set<K extends keyof IPannerOptions>(prop: K, val: IPannerOptions[K], reinit: boolean = false) {
    if (allowedPannerOptionKeys.indexOf(prop) > -1) {
      this.options[prop] = val;
      if (reinit) {
        this.unbindHandlers();
        this.init();
      }
    }
  }

  zoomFit() {
    this.zoom = null;
    this.fit();
  }

  zoomInOut(level: number) {
    this.zoom = level;
    const newHeight = this.naturalHeight * this.zoom;
    const newWidth = this.naturalWidth * this.zoom;
    this.element.style.height = toPx(newHeight);
    this.element.style.width = toPx(newWidth);
    if (this.options.onScaleChange) this.options.onScaleChange(this.currentScale);
  }

  pan(x: number, y: number) {
    this.doPan(x, y);
  }

  clearLast() {
    this.lastX = this.lastY = null;
  }
}

export interface IPanEvent {
  x: number;
  y: number;
  lastX: number | null;
  lastY: number | null;
}

export default function createZeroG(element: HTMLElement, options: IPannerOptions = defaultPannerOptions) {
  if (!element) throw new Error('Unable to initialize zero-g because no DOM element was provided');
  if (!element.parentElement) throw new Error('Unable to initialize zero-g because DOM element provided has no parent');
  const instance = new ZeroGInstance(element, options);
  instance.zoomFit();
  return instance;
}
