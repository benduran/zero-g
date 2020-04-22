
export enum AnnotationType {
  Ellipse,
  Freeform,
  Rectangle,
}

export interface AnnotationPoint {
  x: number;
  y: number;
}

export interface Annotation {
  id: number | string;
  type: AnnotationType;
}

export interface BoxedAnnotation extends Annotation {
  bottom: number;
  left: number;
  right: number;
  top: number;
  type: AnnotationType.Ellipse | AnnotationType.Rectangle;
}

export interface FreeformAnnotation extends Annotation {
  points: AnnotationPoint[];
  type: AnnotationType.Freeform;
}

export interface ScratchPadOptions {
  onAnnotateEnd?: (annotation: Annotation) => void;
  onAnnotateStart?: () => void;
}
