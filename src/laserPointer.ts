import { ZeroGInstance } from './zeroG';

export interface LaserPointerOptions {
  color?: string;
}

export class LaserPointerInstance {
  private svg: SVGSVGElement | null = null;

  constructor(private zeroG: ZeroGInstance, private options: LaserPointerOptions = {}) {
    this.init();
  }

  private init() {
    this.injectSVG();
    this.bindHandlers();
  }

  private injectSVG() {
    if (this.svg) throw new Error('Unable to injectSVG. SVG already exists');
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.zeroG.parent.appendChild(this.svg);
  }

  private bindHandlers() {

  }

  public destroy() {
    this.unbindHandler();
    this.removeSVG();
  }
}

export default function createLaserPointer(instance: ZeroGInstance, options?: LaserPointerOptions) {
  if (!instance) throw new Error('Unable to createLaserPointer because no ZeroGInstance was provided.');
  return new LaserPointerInstance(instance, options);
}
