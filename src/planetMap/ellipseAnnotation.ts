
import { AnnotationType, AnnotationVisibility, BoxedAnnotation } from './types';

export default class EllipseAnnotation implements BoxedAnnotation {
  public bottom: number;

  public left: number;

  public right: number;

  public top: number;

  public id: string;

  public visibility: AnnotationVisibility;

  public type = AnnotationType.Ellipse;

  constructor(props: BoxedAnnotation) {
    this.id = props.id;
    this.visibility = props.visibility;
    this.bottom = props.bottom;
    this.left = props.left;
    this.right = props.right;
    this.top = props.top;
  }
}
