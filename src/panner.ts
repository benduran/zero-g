
import { toPx } from './util';

enum Orientation {
  Landscape,
  Portrait,
  Square,
}

export interface IPannerOptions {
  disabled?: boolean;

  onPanEnd?: (panEvent: IPanEvent, instance: PannerInstance) => void;
  onPanMove?: (panEvent: IPanEvent, instance: PannerInstance) => void;
  onPanStart?: (panEvent: IPanEvent, instance: PannerInstance) => void;
}

const defaultPannerOptions: IPannerOptions = {
  disabled: false,

  onPanEnd: (panEvent: IPanEvent, instance: PannerInstance) => undefined,
  onPanMove: (panEvent: IPanEvent, instance: PannerInstance) => undefined,
  onPanStart: (panEvent: IPanEvent, instance: PannerInstance) => undefined,
};

const allowedPannerOptionKeys = Object.keys(defaultPannerOptions);

class PannerInstance {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private mousedown: boolean = false;

  private naturalHeight: number;
  private naturalWidth: number;
  private orientation: Orientation;
  private parent: HTMLElement;

  constructor(private element: HTMLElement, private options: IPannerOptions = defaultPannerOptions) {
    this.init();
  }

  private bindHandlers() {
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('dragstart', this.preventDrag);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
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

  private doPan(e: MouseEvent) {
    const deltaX = this.lastX !== null ? e.pageX - this.lastX : 0;
    const deltaY = this.lastY !== null ? e.pageY - this.lastY : 0;
    this.element.style.top = toPx(this.element.offsetTop + deltaY);
    this.element.style.left = toPx(this.element.offsetLeft + deltaX);
    this.lastX = e.pageX;
    this.lastY = e.pageY;
  }

  private preventDrag = (e: DragEvent) => {
    e.preventDefault();
  }

  private handleMouseDown = () => {
    this.mousedown = true;
  }

  private handleMouseUp = () => {
    this.lastX = this.lastY = null;
    this.mousedown = false;
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.mousedown) this.doPan(e);
  }

  fit() {
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
}

export interface IPanEvent {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
}

export default function panner(element: HTMLElement, options: IPannerOptions = defaultPannerOptions) {
  if (!element) throw new Error('Unable to initialize panner because no DOM element was provided');
  if (!element.parentElement) throw new Error('Unable to initialize panner because DOM element provided has no parent');
  const instance = new PannerInstance(element, options);
  instance.fit();
  return instance;
}
