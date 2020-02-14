
import { ZeroGInstance } from '../zeroG';
import RectangleAnnotation from './rectangleAnnotation';
import EllipseAnnotation from './ellipseAnnotation';
import FreeformAnnotation from './freeformAnnotation';
import { AnnotationMode } from './types';
import { toPx } from '../util';

export type AnyAnnotation = RectangleAnnotation | EllipseAnnotation | FreeformAnnotation;

export class PlanetMapInstance {
  private annotationContainerElem: HTMLDivElement;

  private mode = AnnotationMode.None;

  constructor(private zeroGInstance: ZeroGInstance, private annotations: AnyAnnotation[] = []) {
    this.init();
  }

  private init(): void {
    if (this.annotationContainerElem) throw new Error('Unable to init PlanetMap as it has already been initialized');
    this.annotationContainerElem = document.createElement('div');
    const p = this.zeroGInstance.getParent();
    if (!p) throw new Error('Invalid instance of zeroG was provided. Instance is missing a parent DOM Element');
    p.appendChild(this.annotationContainerElem);
    this.annotationContainerElem.style.position = 'absolute';
    const interactableZIndex = Number.parseInt(getComputedStyle(this.zeroGInstance.getElement()).zIndex, 10);
    this.annotationContainerElem.style.zIndex = (Number.isNaN(interactableZIndex) ? 1 : interactableZIndex + 1).toString();
    this.resizeAnnotationContainerElem();
    this.bindEventHandlers();
  }

  private bindEventHandlers(): void {
    window.addEventListener('resize', this.handleResize);
  }

  private unbindEventHandlers(): void {
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    this.resizeAnnotationContainerElem();
  }

  private resizeAnnotationContainerElem(): void {
    if (!this.annotationContainerElem) throw new Error('Unable to resizeAnnotationContainerElem because no elem was created');
    const interactable = this.zeroGInstance.getElement();
    if (!interactable) throw new Error('Unable to resizeAnnotationContainerElem because no zeroGInstance element was created');
    const {
      offsetLeft, offsetTop, clientWidth, clientHeight,
    } = interactable;
    this.annotationContainerElem.style.left = toPx(offsetLeft);
    this.annotationContainerElem.style.top = toPx(offsetTop);
    this.annotationContainerElem.style.width = toPx(clientWidth);
    this.annotationContainerElem.style.height = toPx(clientHeight);
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

  public setMode(mode: AnnotationMode): void {
    this.mode = mode;
  }

  public destroy(): void {
    this.unbindEventHandlers();
  }
}

export default function createPlanetMap(zeroGInstance: ZeroGInstance): PlanetMapInstance {
  if (!zeroGInstance) throw new Error('Unable to create an instance of Planet Map without a valid zeroG instance');
  return new PlanetMapInstance(zeroGInstance);
}
