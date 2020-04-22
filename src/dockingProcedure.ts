
import createZeroG, { ZeroGInstance, PannerOptions, PanEvent } from './zeroG';

export interface DockingProcedureOptions extends Omit<PannerOptions, 'onScaleChange'> {
  onScaleChange?: (currentScale: number, sendingChildIndex: number) => void;
}

export class DockingProcedureInstance {
  private instances: ZeroGInstance[] = [];

  constructor(private children: HTMLElement[], private options: DockingProcedureOptions = {}) {
    this.init();
  }

  private init() {
    this.instances = Array.from(this.children).map((c, i) => createZeroG(c as HTMLElement, {
      ...this.options,
      onPanStart: this.handlePanStart(i),
      onPanMove: this.handlePanEnd(i),
      onScaleChange: this.handleScaleChange(i),
    }));
  }

  private handleScaleChange(childIndex: number) {
    return (currentScale: number) => {
      if (this.options.onScaleChange) this.options.onScaleChange(currentScale, childIndex);
    };
  }

  private handlePanStart(childIndex: number) {
    return (panEvent: PanEvent) => {
      this.instances.forEach((z, i) => {
        if (i !== childIndex) z.controlledPan(panEvent);
      });
    };
  }

  private handlePanEnd(childIndex: number) {
    return (panEvent: PanEvent) => {
      this.instances.forEach((z, i) => {
        if (i !== childIndex) z.controlledPan(panEvent);
      });
    };
  }

  zoomInOut(zoomLevel: number) {
    this.instances.forEach((z) => z.zoomInOut(zoomLevel));
  }

  zoomFit() {
    this.instances.forEach((z) => z.zoomFit());
  }
}

export default function createDockingProcedure(children: HTMLElement[], options?: DockingProcedureOptions) {
  if (!children || !children.length) throw new Error('Unable to initialize dockingProcedure because children elements were provided');
  const dockingProcedureInstance = new DockingProcedureInstance(children, options);
  return dockingProcedureInstance;
}
