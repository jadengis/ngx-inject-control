import { forwardRef, InjectionToken, Provider, Type } from '@angular/core';
import { InjectableControl } from './injectable-control.model';

export const NG_INJECTABLE_CONTROL = new InjectionToken<InjectableControl>(
  'ng-injectable-control'
);

export function injectableControlProvider<T>(type: Type<T>): Provider {
  return {
    provide: NG_INJECTABLE_CONTROL,
    useExisting: forwardRef(() => type),
  };
}
