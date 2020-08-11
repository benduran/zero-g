import { toPx } from './util';
import { PanCallback, ZeroGInstance } from './zeroG';

export enum LaserPointerMode {
  Pan= 'PAN',
  Rectangle = 'RECTANGLE',
  Ellipse = 'ELLIPSE',
  Draw = 'DRAW',
}

export enum LaserPointerDrawingType {
  RECTANGLE = 'RECTANGLE',
  ELLIPSE = 'ELLIPSE',
  DRAWING = 'DRAWING',
}

export interface LaserPointerPoint {
  x: number;
  y: number;
}

interface LaserPointerBox extends LaserPointerPoint {
  height: number;
  width: number;
}

interface LaserPointerDrawingBase {
  type: LaserPointerDrawingType;
}

export interface LaserPointerRectangle extends LaserPointerBox, LaserPointerDrawingBase {
  type: LaserPointerDrawingType.RECTANGLE;
}

export interface LaserPointerEllipse extends LaserPointerBox, LaserPointerDrawingBase {
  type: LaserPointerDrawingType.ELLIPSE;
}

export interface LaserPointerDrawing extends LaserPointerDrawingBase {
  points: LaserPointerPoint[];
  type: LaserPointerDrawingType.DRAWING;
}

export interface LaserPointerOptions {
  color?: string;
  mode?: LaserPointerMode;
  simplifyDrawingPoints?: (points: LaserPointerPoint[]) => LaserPointerPoint[];
  strokeWidth?: number;
}

type Shape = LaserPointerRectangle | LaserPointerEllipse | LaserPointerDrawing;

export type OnCreateShapeCallback = (drawing: Shape) => void;

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

  private latestDrawingPoints: LaserPointerPoint[] = [];

  private options: LaserPointerOptions;

  private onCreateShapeCallbacks: OnCreateShapeCallback[] = [];

  private shapesToDraw: Shape[] = [];

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
      out.y = pageY - box.top;
    }
    return out;
  }

  private absoluteSvgToRelativeSvg = (point: LaserPointerPoint): LaserPointerPoint => {
    if (!this.svg) throw new Error('Unable to compute absoluteSvgToRelativeSvg because svg was not present in the DOM');
    const { clientWidth, clientHeight } = this.svg;
    return { x: point.x / clientWidth, y: point.y / clientHeight };
  }

  private relativeSvgToAbsoluteSvg = (point: LaserPointerPoint): LaserPointerPoint => {
    if (!this.svg) throw new Error('Unable to compute relativeSvgToAbsoluteSvg because svg was not present in the DOM');
    const { clientWidth, clientHeight } = this.svg;
    return { x: clientWidth * point.x, y: clientHeight * point.y };
  };

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

  private clearShapes() {
    const latest = this.getLatest();
    if (this.svg && latest) {
      for (const c of Array.from(this.svg.children)) {
        if (c !== latest) c.remove();
      }
    }
  }

  private drawShapes() {
    this.shapesToDraw.forEach((s) => {
      switch (s.type) {
        case LaserPointerDrawingType.DRAWING: {
          if (s.points.length > 0) {
            const path = document.createElementNS(SVG_NS, 'path');
            const firstPoint = s.points[0];
            const d = `M${firstPoint.x} ${firstPoint.y} ${s.points.slice(1).map(p => `L${p.x} ${p.y}`)}`;
            path.setAttribute('d', d);
            path.setAttribute('stroke', this.options.color ?? DEFAULT_COLOR);
            path.setAttribute('stroke-width', (this.options.strokeWidth ?? DEFAULT_STROKE_WIDTH).toString());
            path.setAttribute('fill', 'none');
            this.svg?.appendChild(path);
          }
          break;
        }
        case LaserPointerDrawingType.ELLIPSE:
          break;
        case LaserPointerDrawingType.RECTANGLE:
          break;
        default:
          break;
      }
    });
  }

  private bindHandlers() {
    this.zeroG.onSizeChange(this.handleSizeChange);

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
    this.onCreateShapeCallbacks = [];
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
          this.latestDrawingPoints.push(coords);
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

  private clearLatest() {
    const latest = this.getLatest();
    latest?.remove();
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
          this.injectLatest();
          const p = this.getLatest();
          if (!p) throw new Error('Unable to set initial "d" move because <path /> is missing');
          const rel = this.mousePosToSvgPos(e.pageX, e.pageY);
          p.setAttribute('d', `M${rel.x} ${rel.y}`);
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

  private handleMouseup = () => {
    const l = this.getLatest();
    if (l) {
      switch (this.options.mode) {
        case LaserPointerMode.Draw: {
          const d: LaserPointerDrawing = {
            points: (typeof this.options.simplifyDrawingPoints === 'function'
              ? this.options.simplifyDrawingPoints(this.latestDrawingPoints)
              : this.latestDrawingPoints).map(this.absoluteSvgToRelativeSvg),
            type: LaserPointerDrawingType.DRAWING,
          };
          this.onCreateShapeCallbacks.forEach(cb => cb(d));
          break;
        }
        default:
          break;
      }
    }
    this.latestDrawingPoints = [];
    this.clearLast();
    this.mousedown = false;
    this.swapMouseCursor();
    this.clearLatest();
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

  public onCreateShape(cb: OnCreateShapeCallback) {
    this.onCreateShapeCallbacks.push(cb);
  }

  public addDrawings(drawings: Shape[]) {
    this.shapesToDraw = this.shapesToDraw.concat(drawings.map((d) => {
      if (d.type === LaserPointerDrawingType.DRAWING) return { ...d, points: d.points.map(this.relativeSvgToAbsoluteSvg) };
      return d;
    }));
    this.clearShapes();
    this.drawShapes();
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
