import { PanCallback, ZeroGInstance } from './zeroG';
import { toPx } from './util';

export enum LaserPointerMode {
  Pan,
  Rectangle,
  Ellipse,
  Draw,
}

export interface LaserPointerOptions {
  color?: string;
  mode?: LaserPointerMode;
}

const DEFAULT_COLOR = '#0000ff';
const LATEST_ID = '___laserpointer__latest___';
const SVG_NS = 'http://www.w3.org/2000/svg';

export class LaserPointerInstance {
  private svg: SVGSVGElement | null = null;

  private mousedown = false;

  private lastX: number | null = null;

  private lastY: number | null = null;

  private options: LaserPointerOptions;

  constructor(private zeroG: ZeroGInstance, options?: LaserPointerOptions) {
    this.options = {
      color: DEFAULT_COLOR,
      mode: LaserPointerMode.Pan,
      ...options,
    };
    this.init();
  }

  private init() {
    this.injectSVG();
    this.injectLatest();
    this.bindHandlers();
  }

  private injectSVG() {
    if (this.svg) throw new Error('Unable to injectSVG. SVG already exists');
    this.svg = document.createElementNS(SVG_NS, 'svg');
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

  private getLatest(): SVGPathElement | SVGRectElement | null {
    return this.svg?.querySelector(`#${LATEST_ID}`) ?? null;
  }

  /**
   * Injects the latest <rect />, <ellipse /> or <g /> for handling the drawing
   * @private
   */
  private injectLatest() {
    if (this.svg) {
      let l = this.getLatest();
      if (l) l.remove();
      switch (this.options.mode) {
        case LaserPointerMode.Draw:
          l = document.createElementNS(SVG_NS, 'g') as SVGPathElement;
          break;
        case LaserPointerMode.Ellipse:
          l = document.createElementNS(SVG_NS, 'rect'); // use rect while drawing
          break;
        case LaserPointerMode.Rectangle:
          l = document.createElementNS(SVG_NS, 'rect');
          break;
        default:
          break;
      }
      if (l) {
        l.setAttribute('stroke-color', this.options.color ?? '');
        l.setAttribute('id', LATEST_ID);
        this.svg.appendChild(l);
      }
    }
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
      if (this.mousedown) {
        if (this.options.mode === LaserPointerMode.Pan) this.svg.style.cursor = 'grabbing';
        else this.svg.style.cursor = 'crosshair';
      } else if (this.options.mode !== LaserPointerMode.Pan) this.svg.style.cursor = 'crosshair';
      else this.svg.style.cursor = 'grab';
    }
  }

  private doDrawOrPan(pageX: number, pageY: number) {
    const deltaX = this.lastX !== null ? pageX - this.lastX : 0;
    const deltaY = this.lastY !== null ? pageY - this.lastY : 0;
    switch (this.options.mode) {
      case LaserPointerMode.Draw:
        break;
      case LaserPointerMode.Ellipse:
        break;
      case LaserPointerMode.Rectangle:
        break;
      default:
        this.zeroG.controlledPan({
          x: pageX, y: pageY, lastX: this.lastX, lastY: this.lastY,
        });
        break;
    }
    console.info('deltaX', deltaX, 'deltaY', deltaY);
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
    }
  }

  private handleMousemove = (e: MouseEvent) => {
    this.swapMouseCursor();
    if (this.mousedown) this.doDrawOrPan(e.pageX, e.pageY);
  }

  private handleMouseup = (e: MouseEvent) => {
    this.clearLast();
    this.mousedown = false;
    this.swapMouseCursor();
  }

  private handleSizeChange = (width: number | string, height: number | string, instance: ZeroGInstance) => {
    if (this.svg) {
      this.svg.style.width = typeof width === 'string' ? width : toPx(width);
      this.svg.style.height = typeof height === 'string' ? height : toPx(height);
      this.svg.style.top = instance.element.style.top;
      this.svg.style.left = instance.element.style.left;
      this.svg.setAttribute('viewbox', `0 0 ${this.svg.clientWidth} ${this.svg.clientHeight}`);
    }
  }

  private handlePanMove: PanCallback = (_, instance) => {
    if (this.svg) {
      this.svg.style.top = instance.element.style.top;
      this.svg.style.left = instance.element.style.left;
    }
  }

  public set<K extends keyof LaserPointerOptions>(prop: K, val: LaserPointerOptions[K]) {
    this.options = {
      ...this.options,
      [prop]: val,
    };
    this.injectLatest();
  }

  public destroy() {
    this.unbindHandlers();
    this.removeSVG();
  }
}

export default function createLaserPointer(instance: ZeroGInstance, options?: LaserPointerOptions) {
  if (!instance) throw new Error('Unable to createLaserPointer because no ZeroGInstance was provided.');
  return new LaserPointerInstance(instance, options);
}
