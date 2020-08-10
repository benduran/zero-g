import { toPx } from './util';
import { PanCallback, ZeroGInstance } from './zeroG';

export enum LaserPointerMode {
  Pan,
  Rectangle,
  Ellipse,
  Draw,
}

export interface LaserPointerOptions {
  color?: string;
  mode?: LaserPointerMode;
  strokeWidth?: number;
}

const DEFAULT_COLOR = '#ff0000';
const DEFAULT_STROKE_WIDTH = 4;
const LATEST_ID = '___laserpointer__latest___';
const SVG_NS = 'http://www.w3.org/2000/svg';

export class LaserPointerInstance {
  private svgHeight = 0;

  private svgWidth = 0;

  private svgTop = 0;

  private svgLeft = 0;

  private svg: SVGSVGElement | null = null;

  private mousedown = false;

  private lastX: number | null = null;

  private lastY: number | null = null;

  private options: LaserPointerOptions;

  constructor(private zeroG: ZeroGInstance, options?: LaserPointerOptions) {
    this.options = {
      color: DEFAULT_COLOR,
      mode: LaserPointerMode.Pan,
      strokeWidth: DEFAULT_STROKE_WIDTH,
      ...options,
    };
    this.init();
  }

  private mousePosToSvgPos(pageX: number, pageY: number) {
    const out = { x: 0, y: 0 };
    if (this.svg) {
      const box = this.svg.getBoundingClientRect();
      out.x = pageX - box.left;
      out.y = pageX - box.top;
    }
    return out;
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
          l = document.createElementNS(SVG_NS, 'path');
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
        l.setAttribute('fill', 'none');
        l.setAttribute('stroke', this.options.color ?? DEFAULT_COLOR);
        l.setAttribute('stroke-width', (this.options.strokeWidth ?? DEFAULT_STROKE_WIDTH).toString());
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
    // const deltaX = this.lastX !== null ? pageX - this.lastX : 0;
    // const deltaY = this.lastY !== null ? pageY - this.lastY : 0;
    switch (this.options.mode) {
      case LaserPointerMode.Draw: {
        const path = this.getLatest();
        if (path) {
          const coords = this.mousePosToSvgPos(pageX, pageY);
          path.setAttribute('d', `${path.getAttribute('d')} L${coords.x} ${coords.y}`);
        }
        break;
      }
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
      switch (this.options.mode) {
        case LaserPointerMode.Draw: {
          // need to move the <g />
          const p = this.getLatest();
          if (!p) throw new Error('Unable to set intial <g /> move because <g /> is missing');
          p.setAttribute('d', `M${e.pageX} ${e.pageY}`);
          break;
        }
        default:
          break;
      }
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

  private handleSizeChange = (width: number, height: number, instance: ZeroGInstance) => {
    if (this.svg) {
      this.svg.setAttribute('width', width.toString());
      this.svg.setAttribute('height', height.toString());
      const { clientHeight, clientWidth } = this.svg;
      this.svgHeight = clientHeight;
      this.svgWidth = clientWidth;
      this.svg.style.top = instance.element.style.top;
      this.svg.style.left = instance.element.style.left;
      this.svg.setAttribute('viewbox', `0 0 ${this.svgWidth} ${this.svgHeight}`);
    }
  }

  private handlePanMove: PanCallback = (_, instance) => {
    if (this.svg) {
      const { element: { offsetTop, offsetLeft } } = instance;
      this.svgTop = offsetTop;
      this.svgLeft = offsetLeft;
      this.svg.style.top = toPx(this.svgTop);
      this.svg.style.left = toPx(this.svgLeft);
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
