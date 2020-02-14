
import { ZeroGInstance } from '../zeroG';
import RectangleAnnotation from './rectangleAnnotation';
import EllipseAnnotation from './ellipseAnnotation';
import FreeformAnnotation from './freeformAnnotation';

export type AnyAnnotation = RectangleAnnotation | EllipseAnnotation | FreeformAnnotation;

export class PlanetMapInstance {
  private annotationContainerElem: HTMLDivElement;

  constructor(private zeroGInstance: ZeroGInstance, private annotations: AnyAnnotation[] = []) {
    this.init();
  }

  private init(): void {
    if (this.annotationContainerElem) throw new Error('Unable to init PlanetMap as it has already been initialized');
    this.annotationContainerElem = document.createElement('div');
    const p = this.zeroGInstance.getParent();
    if (!p) throw new Error('Invalid instance of zeroG was provided. Instance is missing a parent DOM Element');
    p.appendChild(this.annotationContainerElem);
  }

  private renderAnnotations(): void {
    this.annotations.forEach((a) => {});
  }

  public setAnnotations(annotations: AnyAnnotation[]): void {
    this.annotations = annotations;
  }

  public appendAnnotation(annotation: AnyAnnotation): void {
    this.annotations = this.annotations.concat(annotation);
    this.renderAnnotations();
  }
}

export default function createPlanetMap(zeroGInstance: ZeroGInstance): PlanetMapInstance {
  if (!zeroGInstance) throw new Error('Unable to create an instance of Planet Map without a valid zeroG instance');
  return new PlanetMapInstance(zeroGInstance);
}
