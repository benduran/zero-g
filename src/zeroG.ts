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
}

export type OnScaleChangeCallback = (currentScale: number, instance: ZeroGInstance) => void;
export type PanCallback = (panEvent: PanEvent, instance: ZeroGInstance) => void;
export type OnSizeChangeCallback = (width: number, height: number, instance: ZeroGInstance) => void;

const defaultPannerOptions: PannerOptions = {
  changeCursorOnPan: true,
  disabled: false,
  refitOnResize: true,
};

const allowedPannerOptionKeys = Object.keys(defaultPannerOptions);

export class ZeroGInstance {
  private lastX: number | null = null;

  private lastY: number | null = null;

  private zoom: number | null = null;

  private mousedown: boolean = false;

  private hasLoadHandler: boolean = false;

  private windowResizeTimeout: any;

  private naturalHeight: number;

  private naturalWidth: number;

  private orientation: Orientation;

  private onScaleChangeCallbacks: OnScaleChangeCallback[] = [];

  private onPanEndCallbacks: PanCallback[] = [];

  private onPanMoveCallbacks: PanCallback[] = [];

  private onPanStartCallbacks: PanCallback[] = [];

  private onSizeChangeCallbacks: OnSizeChangeCallback[] = [];

  private parent: HTMLElement;

  constructor(
    public readonly element: HTMLElement,
    private options: PannerOptions = defaultPannerOptions,
    private controlledByDockingProcedure: boolean = false,
  ) {
    this.options = { ...defaultPannerOptions, ...options };
    this.init();
  }

  private get currentScale(): number {
    return Math.min(this.element.clientHeight / this.naturalHeight, this.element.clientWidth / this.naturalWidth);
  }

  private bindHandlers() {
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

  private unbindHandlers() {
    if (this.hasLoadHandler) {
      this.hasLoadHandler = false;
      this.element.removeEventListener('load', this.handleInitialLoad);
    }
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  private computeNaturalDimensions() {
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

  private init() {
    this.parent = this.element.parentElement!;
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
    return undefined;
  }

  private swapMouseCursor() {
    if (this.mousedown) this.element.style.cursor = 'grabbing';
    else this.element.style.cursor = 'grab';
  }

  private doPan(pageX: number, pageY: number, lastX: number | null = this.lastX, lastY: number | null = this.lastY) {
    const deltaX = lastX !== null ? pageX - lastX : 0;
    const deltaY = lastY !== null ? pageY - lastY : 0;
    this.element.style.top = toPx(this.element.offsetTop + deltaY);
    this.element.style.left = toPx(this.element.offsetLeft + deltaX);
    this.lastX = pageX;
    this.lastY = pageY;
  }

  private preventDrag = (e: DragEvent) => {
    e.preventDefault();
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mousedown = true;
      if (this.options.changeCursorOnPan) this.swapMouseCursor();
      this.onPanStartCallbacks.forEach(cb => cb({
        lastX: null, lastY: null, x: e.pageX, y: e.pageY,
      }, this));
    }
  }

  private handleMouseUp = (e: MouseEvent) => {
    this.onPanEndCallbacks.forEach(cb => cb({
      lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY,
    }, this));
    this.clearLast();
    this.mousedown = false;
    if (this.options.changeCursorOnPan) this.swapMouseCursor();
  }

  private handleMouseMove = (e: MouseEvent) => {
    if (this.mousedown) {
      if (!this.controlledByDockingProcedure) this.doPan(e.pageX, e.pageY);
      this.onPanMoveCallbacks.forEach(cb => cb({
        lastX: this.lastX, lastY: this.lastY, x: e.pageX, y: e.pageY,
      }, this));
    }
  }

  private handleWindowResize = () => {
    if (this.windowResizeTimeout) this.windowResizeTimeout = clearTimeout(this.windowResizeTimeout);
    this.windowResizeTimeout = setTimeout(() => this.zoomFit(), 1);
  }

  private handleInitialLoad = () => {
    this.computeNaturalDimensions();
    this.fit();
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
    const { clientHeight, clientWidth } = this.element;
    this.onSizeChangeCallbacks.forEach(cb => cb(clientWidth, clientHeight, this));
    this.onScaleChangeCallbacks.forEach(cb => cb(this.currentScale, this));
  }

  private queueInitialFit() {
    if (this.element instanceof HTMLImageElement || this.element instanceof HTMLVideoElement) {
      // this.element.onload = this.handleInitialLoad;
      this.element.addEventListener('load', this.handleInitialLoad);
    }
  }

  private clearLast() {
    this.lastX = null;
    this.lastY = null;
  }

  public destroy() {
    this.unbindHandlers();
  }

  public controlledPan(panEvent: PanEvent) {
    this.pan(panEvent.x, panEvent.y, panEvent.lastX, panEvent.lastY);
    this.onPanMoveCallbacks.forEach(cb => cb(panEvent, this));
  }

  public set<K extends keyof PannerOptions>(prop: K, val: PannerOptions[K], reinit: boolean = false) {
    if (allowedPannerOptionKeys.indexOf(prop) > -1) {
      this.options[prop] = val;
      if (reinit) {
        this.unbindHandlers();
        this.init();
      }
    }
  }

  public zoomFit() {
    this.zoom = null;
    this.fit();
  }

  public zoomInOut(level: number) {
    this.zoom = level;
    const newHeight = this.naturalHeight * this.zoom;
    const newWidth = this.naturalWidth * this.zoom;
    this.element.style.height = toPx(newHeight);
    this.element.style.width = toPx(newWidth);
    this.onSizeChangeCallbacks.forEach((cb => cb(newWidth, newHeight)));
    this.onScaleChangeCallbacks.forEach(cb => cb(this.currentScale));
  }

  public pan(x: number, y: number, lastX: number | null, lastY: number | null) {
    this.doPan(x, y, lastX, lastY);
  }

  public onPanStart(cb: PanCallback) {
    this.onPanStartCallbacks.push(cb);
  }

  public onPanEnd(cb: PanCallback) {
    this.onPanEndCallbacks.push(cb);
  }

  public onPanMove(cb: PanCallback) {
    this.onPanMoveCallbacks.push(cb);
  }

  public onScaleChange(cb: OnScaleChangeCallback) {
    this.onScaleChangeCallbacks.push(cb);
  }

  public onSizeChange(cb: OnSizeChangeCallback) {
    this.onSizeChangeCallbacks.push(cb);
  }
}

export interface PanEvent {
  x: number;
  y: number;
  lastX: number | null;
  lastY: number | null;
}

export function createZeroG(element: HTMLElement, options: PannerOptions = defaultPannerOptions) {
  if (!element) throw new Error('Unable to initialize zero-g because no DOM element was provided');
  if (!element.parentElement) throw new Error('Unable to initialize zero-g because DOM element provided has no parent');
  const instance = new ZeroGInstance(element, options);
  instance.zoomFit();
  return instance;
}
