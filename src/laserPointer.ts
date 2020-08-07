import { PanCallback, ZeroGInstance } from './zeroG';
import { toPx } from './util';

export interface LaserPointerOptions {
  color?: string;
}

export class LaserPointerInstance {
  static DEFAULT_COLOR = '#0000ff';

  private svg: SVGSVGElement | null = null;

  private mousedown = false;

  private lastX: number | null = null;

  private lastY: number | null = null;

  private options: LaserPointerOptions;

  constructor(private zeroG: ZeroGInstance, options?: LaserPointerOptions) {
    this.options = {
      color: LaserPointerInstance.DEFAULT_COLOR,
      ...options,
    };
    this.init();
  }

  private init() {
    this.injectSVG();
    this.bindHandlers();
  }

  private injectSVG() {
    if (this.svg) throw new Error('Unable to injectSVG. SVG already exists');
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.zeroG.element.parentElement?.appendChild(this.svg);
    this.svg.style.position = 'absolute';
    this.svg.style.willChange = 'top, left, width, height';
    // the original zeroG likely already computed its height and position right now
    const box = this.zeroG.element.getBoundingClientRect();
    this.handleSizeChange(box.width, box.height, this.zeroG);
    this.handlePanMove({} as any, this.zeroG);
  }

  private removeSVG() {
    if (this.svg) this.svg.remove();
  }

  private bindHandlers() {
    this.zeroG.onSizeChange(this.handleSizeChange);
    this.zeroG.onPanMove(this.handlePanMove);

    if (this.svg) {
      this.svg.addEventListener('mousedown', this.handleMousedown);
      this.svg.addEventListener('mousemove', this.handleMousemove);
      this.svg.addEventListener('mouseup', this.handleMouseup);
    }
  }

  private unbindHandlers() {
    if (this.svg) {
      this.svg.removeEventListener('mousedown', this.handleMousedown);
      this.svg.removeEventListener('mousemove', this.handleMousemove);
      this.svg.removeEventListener('mouseup', this.handleMouseup);
    }
  }

  private swapMouseCursor() {
    if (this.svg) {
      if (this.mousedown) this.svg.style.cursor = 'crosshair';
      else this.svg.style.cursor = 'default';
    }
  }

  private doDrawOrPan(pageX: number, pageY: number) {
    const deltaX = this.lastX !== null ? pageX - this.lastX : 0;
    const deltaY = this.lastY !== null ? pageY - this.lastY : 0;
    this.zeroG.controlledPan({
      x: pageX, y: pageY, lastX: this.lastX, lastY: this.lastY,
    });
    this.lastX = pageX;
    this.lastY = pageY;
  }

  private clearLast() {
    this.lastX = null;
    this.lastY = null;
  }

  private handleMousedown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.mousedown = true;
      this.swapMouseCursor();
    }
  }

  private handleMousemove = (e: MouseEvent) => {
    if (this.mousedown) this.doDrawOrPan(e.pageX, e.pageY);
  }

  private handleMouseup = (e: MouseEvent) => {
    this.clearLast();
    this.mousedown = false;
  }

  private handleSizeChange = (width: number | string, height: number | string, instance: ZeroGInstance) => {
    if (this.svg) {
      this.svg.style.width = typeof width === 'string' ? width : toPx(width);
      this.svg.style.height = typeof height === 'string' ? height : toPx(height);
      this.svg.style.top = instance.element.style.top;
      this.svg.style.left = instance.element.style.left;
    }
  }

  private handlePanMove: PanCallback = (_, instance) => {
    if (this.svg) {
      this.svg.style.top = instance.element.style.top;
      this.svg.style.left = instance.element.style.left;
    }
  }

  // private handle

  public destroy() {
    this.unbindHandlers();
    this.removeSVG();
  }
}

export default function createLaserPointer(instance: ZeroGInstance, options?: LaserPointerOptions) {
  if (!instance) throw new Error('Unable to createLaserPointer because no ZeroGInstance was provided.');
  return new LaserPointerInstance(instance, options);
}
