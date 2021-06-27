import { AbstractControl } from "@angular/forms";

export interface InjectableControl {
  readonly control: AbstractControl;
}
