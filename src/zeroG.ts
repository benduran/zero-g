
import { toPx } from './util';

enum Orientation {
  Landscape,
  Portrait,
  Square,
}

export interface PannerOptions {
  changeCursorOnPan?: boolean;
  disabled?: boolean;
  refitOnResize?: boolean;

  onScaleChange?: (currentScale: number) => void;
  onPanEnd?: (panEvent: PaneEvent, instance: ZeroGInstance) => void;
  onPanMove?: (panEvent: PaneEvent, instance: ZeroGInstance) => void;
  onPanStart?: (panEvent: PaneEvent, instance: ZeroGInstance) => void;
}

const defaultPannerOptions: PannerOptions = {
  changeCursorOnPan: true,
  disabled: false,
  refitOnResize: true,

  onScaleChange: () => undefined,
  onPanEnd: () => undefined,
  onPanMove: () => undefined,
  onPanStart: () => undefined,
};

const allowedPannerOptionKeys = Object.keys(defaultPannerOptions);

export class ZeroGInstance {
  private lastX: number | null = null;
  private lastY: number | null = null;
  private zoom: number | null = null;
  private mousedown = false;
  private hasLoadHandler = false;
  private windowResizeTimeout: NodeJS.Timeout | void;

  private naturalHeight: number;
  private naturalWidth: number;
  private orientation: Orientation;
  private parent: HTMLElement;

  constructor(private element: HTMLElement, private options: PannerOptions = defaultPannerOptions, private controlledByDockingProcedure: boolean = false) {
    this.options = { ...defaultPannerOptions, ...options };
    this.init();
  }

  private get currentScale(): number {
    return Math.min(this.element.clientHeight / this.naturalHeight, this.element.clientWidth / this.naturalWidth);
  }

  private bindHandlers(): void {
    if (this.element instanceof HTMLImageElement || this.element instanceof HTMLVideoElement) {
      this.hasLoadHandler = true;
      this.element.addEventListener('load', this.handleInitialLoad);
    }
    this.element.addEventListener('mousedown', this.handleMouseDown);
    this.element.addEventListener('dragstart', this.preventDrag);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    if (this.options.refitOnResize) window.addEventListener('resize', this.handleWindowResize);
  }

  private unbindHandlers(): void {
    if (this.hasLoadHandler) {
      this.hasLoadHandler = false;
      this.element.removeEventListener('load', this.handleInitialLoad);
    }
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  private computeNaturalDimensions(): void {
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
  }

  private init(): void {
    if (!this.element.parentElement) throw new Error('Invalid DOM structure provided. Parent element must not be null.');
    this.parent = this.element.parentElement;
    this.computeNaturalDimensions();
    if (this.naturalWidth > this.naturalHeight) this.orientation = Orientation.Landscape;
    else if (this.naturalHeight > this.naturalWidth) this.orientation = Orientation.Portrait;
    else this.orientation = Orientation.Square;
    this.element.style.position = 'absolute';
    this.element.style.willChange = 'top, left, width, height';
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
    this.bindHandlers();
    this.queueInitialFit();
  }

  private fitLandscape(): void {
    this.element.style.width = '100%';
    this.element.style.height = 'auto';
    this.element.style.left = toPx(0);
    this.element.style.top = toPx((this.parent.clientHeight - this.element.clientHeight) / 2);
  }

  private fitPortrait(): void {
    this.element.style.width = 'auto';
    this.element.style.height = '100%';
    this.element.style.left = toPx((this.parent.clientWidth - this.element.clientWidth) / 2);
    this.element.style.top = toPx(0);
  }

  private adjustIfOverflown(): void {
    if (this.element.clientHeight > this.parent.clientHeight) return this.fitPortrait();
    if (this.element.clientWidth > this.parent.clientWidth) return this.fitLandscape();
  }

  private swapMouseCursor(): void {
    if (this.mousedown) this.element.style.cursor = 'grabbing';
    else this.element.style.cursor = 'grab';
  }

  private doPan(pageX: number, pageY: number, lastX: number | null = this.lastX, lastY: number | null = this.lastY): void {
    const deltaX = lastX !== null ? pageX - lastX : 0;
    const deltaY = lastY !== null ? pageY - lastY : 0;
    this.element.style.top = toPx(this.element.offsetTop + deltaY);
    this.element.style.left = toPx(this.element.offsetLeft + deltaX);
    this.lastX = pageX;
    this.lastY = pageY;
  }

  private preventDrag = (e: DragEvent): void => {
    e.preventDefault();
  }

  private handleMouseDown = (e: MouseEvent): void => {
    this.mousedown = true;
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
    if (this.options.onPanStart) this.options.onPanStart({ lastX: null, lastY: null, x: e.pageX, y: e.pageY }, this);
  }

  private handleMouseUp = (e: MouseEvent): void => {
    if (this.options.onPanEnd) this.options.onPanEnd({ lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY }, this);
    this.clearLast();
    this.mousedown = false;
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
  }

  private handleMouseMove = (e: MouseEvent): void => {
    if (this.mousedown) {
      if (this.options.onPanMove) this.options.onPanMove({ lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY }, this);
      if (!this.controlledByDockingProcedure) this.doPan(e.pageX, e.pageY);
    }
  }

  private handleWindowResize = (): void => {
    if (this.windowResizeTimeout) this.windowResizeTimeout = clearTimeout(this.windowResizeTimeout);
    this.windowResizeTimeout = setTimeout(() => this.zoomFit(), 1);
  }

  private handleInitialLoad = (): void => {
    this.computeNaturalDimensions();
    this.fit();
  }

  private fit(): void {
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

  private queueInitialFit(): void {
    if (this.element instanceof HTMLImageElement || this.element instanceof HTMLVideoElement) {
      // this.element.onload = this.handleInitialLoad;
      this.element.addEventListener('load', this.handleInitialLoad);
    }
  }

  public destroy(): void {
    this.unbindHandlers();
  }

  public controlledPan(panEvent: PaneEvent): void {
    this.pan(panEvent.x, panEvent.y, panEvent.lastX, panEvent.lastY);
  }

  public set<K extends keyof PannerOptions>(prop: K, val: PannerOptions[K], reinit = false): void {
    if (allowedPannerOptionKeys.indexOf(prop) > -1) {
      this.options[prop] = val;
      if (reinit) {
        this.unbindHandlers();
        this.init();
      }
    }
  }

  public zoomFit(): void {
    this.zoom = null;
    this.fit();
  }

  public zoomInOut(level: number): void {
    this.zoom = level;
    const newHeight = this.naturalHeight * this.zoom;
    const newWidth = this.naturalWidth * this.zoom;
    this.element.style.height = toPx(newHeight);
    this.element.style.width = toPx(newWidth);
    if (this.options.onScaleChange) this.options.onScaleChange(this.currentScale);
  }

  public pan(x: number, y: number, lastX: number | null, lastY: number | null): void {
    this.doPan(x, y, lastX, lastY);
  }

  public clearLast(): void {
    this.lastX = this.lastY = null;
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  public getParent(): HTMLElement {
    return this.parent;
  }
}

export interface PaneEvent {
  x: number;
  y: number;
  lastX: number | null;
  lastY: number | null;
}

export default function createZeroG(element: HTMLElement, options: PannerOptions = defaultPannerOptions): ZeroGInstance {
  if (!element) throw new Error('Unable to initialize zero-g because no DOM element was provided');
  if (!element.parentElement) throw new Error('Unable to initialize zero-g because DOM element provided has no parent');
  const instance = new ZeroGInstance(element, options);
  instance.zoomFit();
  return instance;
}
