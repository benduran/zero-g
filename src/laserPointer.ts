import { PanCallback, ZeroGInstance } from './zeroG';
import { toPx } from './util';

export interface LaserPointerOptions {
  color?: string;
}

export class LaserPointerInstance {
  static DEFAULT_COLOR = '#0000ff';

  private svg: SVGSVGElement | null = null;

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
    this.handleSizeChange(box.width, box.height);
    this.handlePanMove({} as any, this.zeroG);
  }

  private removeSVG() {
    if (this.svg) this.svg.remove();
  }

  private bindHandlers() {
    this.zeroG.onSizeChange(this.handleSizeChange);
    this.zeroG.onPanMove(this.handlePanMove);
  }

  private unbindHandlers() {
    /* NO-OP */
  }

  private handleSizeChange = (width: number | string, height: number | string) => {
    if (this.svg) {
      this.svg.style.width = typeof width === 'string' ? width : toPx(width);
      this.svg.style.height = typeof height === 'string' ? height : toPx(height);
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
