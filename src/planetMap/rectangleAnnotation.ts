
import { BoxedAnnotation, AnnotationType, AnnotationVisibility } from './types';

export default class RectangleAnnotation implements BoxedAnnotation {
  public id: string;

  public visibility: AnnotationVisibility;

  public bottom: number;

  public left: number;

  public right: number;

  public top: number;

  public type = AnnotationType.Rectangle;

  constructor(props: BoxedAnnotation) {
    this.id = props.id;
    this.visibility = props.visibility;
    this.bottom = props.bottom;
    this.left = props.left;
    this.right = props.right;
    this.top = props.top;
  }
}
