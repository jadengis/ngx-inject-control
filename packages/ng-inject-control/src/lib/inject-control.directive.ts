import {
  Directive,
  Host,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import {
  AbstractControl,
  ControlContainer,
  FormArray,
  FormGroup,
} from '@angular/forms';
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
export class InjectControlDirective implements OnChanges, OnDestroy {
  constructor(
    private readonly parent: ControlContainer,
    @Host()
    @Inject(NG_INJECTABLE_CONTROL)
    private readonly host: InjectableControl
  ) {}

  @Input('injectControl')
  readonly controlName!: string | number;

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

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes.controlName;
    if (change) {
      if (!change.firstChange) {
        this._tearDownControl(change.previousValue);
      }
      this._setUpControl();
    }
  }

  ngOnDestroy(): void {
    this._tearDownControl(this.controlName);
  }

  private _setUpControl(): void {
    const parent = this.parent.control;
    const control = resolveControl(parent, this.controlName);
    if (!control) {
      throw new Error(`No control ${this.controlName} in control container`);
    }
    this.originalControl = control;
    resolvedPromise.then(() => {
      copyControlState(this.host, control, this.isDisabled);
      replaceInParent(
        parent as FormGroup | FormArray,
        this.controlName,
        this.host.control
      );
    });
  }

  private _tearDownControl(name: string | number): void {
    const parent = this.parent.control;
    resolvedPromise.then(() => {
      if (this.originalControl) {
        replaceInParent(
          parent as FormGroup | FormArray,
          name,
          this.originalControl
        );
      }
    });
  }
}

function copyControlState(
  host: InjectableControl,
  control: AbstractControl,
  isDisabled?: boolean
): void {
  if (control.value) {
    host.control.patchValue(control.value);
  }
  if (isDisabled === undefined && control.enabled) {
    host.control.enable();
  }
  if (isDisabled === undefined && control.disabled) {
    host.control.disable();
  }
  if (control.validator) {
    host.control.setValidators(control.validator);
    host.control.updateValueAndValidity({
      onlySelf: true,
      emitEvent: false,
    });
  }
  if (control.asyncValidator) {
    host.control.setAsyncValidators(control.asyncValidator);
    host.control.updateValueAndValidity({
      onlySelf: true,
      emitEvent: false,
    });
  }
}
function resolveControl(parent: AbstractControl | null, name: string | number) {
  if (parent instanceof FormGroup) {
    if (typeof name !== 'string') {
      throw new Error(`name must be a string`);
    }
    return parent.get(name);
  } else if (parent instanceof FormArray) {
    if (typeof name !== 'number') {
      throw new Error(`name must be a number`);
    }
    return parent.at(name);
  }
  throw new Error(
    `Unsupported control container type ${parent?.constructor.name}`
  );
}

function replaceInParent(
  parent: FormGroup | FormArray,
  name: string | number,
  control: AbstractControl
): void {
  if (parent instanceof FormGroup) {
    parent.setControl(name as string, control);
  } else {
    parent.setControl(name as number, control);
  }
  parent.updateValueAndValidity({ emitEvent: false });
}
