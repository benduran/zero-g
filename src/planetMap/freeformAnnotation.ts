
import {
  AnnotationType, FreeformAnnotation as IFreeformAnnotation, AnnotationVisibility, Point,
} from './types';

export default class FreeformAnnotation implements IFreeformAnnotation {
  public id: string;

  public visibility: AnnotationVisibility;

  public points: Point[];

  public type = AnnotationType.Freeform;

  constructor(props: FreeformAnnotation) {
    this.id = props.id;
    this.visibility = props.visibility;
    this.points = props.points;
  }
}
