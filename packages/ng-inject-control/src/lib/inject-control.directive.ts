import {
  Directive,
  Host,
  Inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { AbstractControl, ControlContainer, FormGroup } from '@angular/forms';
import { InjectableControl } from './injectable-control.model';
import { NG_INJECTABLE_CONTROL } from './injectable-control.token';

/**
 * Work around for ExpressionChangeAfterCheckedError from
 * https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
 */
const resolvedPromise = (() => Promise.resolve(null))();

@Directive({
  selector: '[injectControl]',
})
export class InjectControlDirective implements OnInit, OnDestroy {
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
    this.isDisabled = isDisabled;
  }

  private originalControl?: AbstractControl;
  private isDisabled?: boolean;

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
      this.originalControl = control;
      resolvedPromise.then(() => {
        if (control.value) {
          this.host.control.patchValue(control.value);
        }
        if (this.isDisabled === undefined && control.enabled) {
          this.host.control.enable();
        }
        if (this.isDisabled === undefined && control.disabled) {
          this.host.control.disable();
        }
        if (control.validator) {
          this.host.control.setValidators(control.validator);
          this.host.control.updateValueAndValidity({
            onlySelf: true,
            emitEvent: false,
          });
        }
        if (control.asyncValidator) {
          this.host.control.setAsyncValidators(control.asyncValidator);
          this.host.control.updateValueAndValidity({
            onlySelf: true,
            emitEvent: false,
          });
        }
        parent.setControl(this.injectControl, this.host.control);
        parent.updateValueAndValidity({ emitEvent: false });
      });
    } else {
      throw new Error(
        `Unsupported control container type ${parent?.constructor.name}`
      );
    }
  }

  ngOnDestroy(): void {
    const parent = this.controlContainer.control;
    if (parent instanceof FormGroup) {
      resolvedPromise.then(() => {
        if (this.originalControl) {
          parent.setControl(this.injectControl, this.originalControl);
          parent.updateValueAndValidity({ emitEvent: false });
        }
      });
    }
  }
}
