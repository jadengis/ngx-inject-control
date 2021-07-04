import { Directive, Host, Inject, Input, OnInit } from '@angular/core';
import { ControlContainer, FormArray, FormGroup } from '@angular/forms';
import { InjectableControl } from './injectable-control.model';
import { NG_INJECTABLE_CONTROL } from './injectable-control.token';

@Directive({
  selector: '[injectControl]',
})
export class InjectControlDirective implements OnInit {
  constructor(
    private readonly controlContainer: ControlContainer,
    @Host()
    @Inject(NG_INJECTABLE_CONTROL)
    private readonly host: InjectableControl
  ) {}

  @Input()
  readonly injectControl!: string;

  @Input()
  set disabled(isDisabled: boolean) {
    const control = this.host.control;
    if (isDisabled && control.enabled) {
      control.disable();
    } else if (!isDisabled && control.disabled) {
      control.enable();
    }
  }

  /**
   * TODO: Use on changes instead and support a case where the input can be
   * changed, similar to how FormControlName and FormControlDirective work.
   */
  ngOnInit(): void {
    const parent = this.controlContainer.control;
    if (parent instanceof FormGroup) {
      const control = parent.get(this.injectControl);
      if (!control) {
        throw new Error(
          `No control ${this.injectControl} in control container`
        );
      }
      if (control.value) {
        this.host.control.patchValue(control.value);
      }
      if (control.validator) {
        this.host.control.setValidators(control.validator);
        this.host.control.updateValueAndValidity({ onlySelf: true });
      }
      if (control.asyncValidator) {
        this.host.control.setAsyncValidators(control.asyncValidator);
        this.host.control.updateValueAndValidity({ onlySelf: true });
      }
      parent.setControl(this.injectControl, this.host.control);
    } else if (parent instanceof FormArray) {
      parent.push(this.host.control);
    } else {
      throw new Error(
        `Unsupported control container type ${parent?.constructor.name}`
      );
    }
  }
}
