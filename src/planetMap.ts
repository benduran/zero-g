
import { toPx } from './util';
import { ZeroGInstance } from './zeroG';

export enum AnnotationType {
  Ellipse,
  Rectangle,
  Freeform,
}

export enum AnnotationVisibility {
  Hidden,
  Minimal,
  Full,
}

interface IBaseAnnotation {
  id: string;
  type: AnnotationType;
  visibility: AnnotationVisibility;
}

interface IBoxedAnnotation extends IBaseAnnotation {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface IPoint {
  x: number;
  y: number;
}

interface IFreeformAnnotation extends IBaseAnnotation {
  points: IPoint[];
}

export class RectangleAnnotation implements IBoxedAnnotation {
  public id: string;
  public visibility: AnnotationVisibility;
  public bottom: number;
  public left: number;
  public right: number;
  public top: number;

  public type = AnnotationType.Rectangle;

  constructor(props: IBoxedAnnotation) {
    this.id = props.id;
    this.visibility = props.visibility;
    this.bottom = props.bottom;
    this.left = props.left;
    this.right = props.right;
    this.top = props.top;
  }
}

export class EllipseAnnotation extends RectangleAnnotation {
  public type = AnnotationType.Ellipse;
}

export class FreeformAnnotation implements IFreeformAnnotation {
  public id: string;
  public visibility: AnnotationVisibility;
  public points: IPoint[];

  public type = AnnotationType.Freeform;

  constructor(props: IFreeformAnnotation) {
    this.id = props.id;
    this.visibility = props.visibility;
    this.points = props.points;
  }
}

export type AnyAnnotation = RectangleAnnotation | EllipseAnnotation | FreeformAnnotation;

export class PlanetMapInstance {
  private annotationContainerElem: HTMLDivElement;

  constructor(private zeroGInstance: ZeroGInstance, annotations: AnyAnnotation[] = []) {
    this.init();
  }

  private init() {
    if (this.annotationContainerElem) throw new Error('Unable to init PlanetMap as it has already been initialized');
    this.annotationContainerElem = document.createElement('div');
    const p = this.zeroGInstance.getParent();
    if (!p) throw new Error('Invalid instance of zeroG was provided. Instance is missing a parent DOM Element');
    p.appendChild(this.annotationContainerElem);
  }
}

export default function createPlanetMap(
  zeroGInstance: ZeroGInstance,
  initialAnnotations: AnyAnnotation[] = [],
) {
  if (!zeroGInstance) throw new Error('Unable to create an instance of Planet Map without a valid zeroG instance');
  return new PlanetMapInstance(zeroGInstance, initialAnnotations);
}
