
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

export interface BaseAnnotation {
  id: string;
  type: AnnotationType;
  visibility: AnnotationVisibility;
}

export interface BoxedAnnotation extends BaseAnnotation {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface FreeformAnnotation extends BaseAnnotation {
  points: Point[];
}

export enum AnnotationMode {
  None,
  Rectangle,
  Ellipse,
  Freeform,
}
