import { forwardRef, InjectionToken, Provider, Type } from '@angular/core';
import { InjectableControl } from './injectable-control.model';

export const NGX_INJECTABLE_CONTROL = new InjectionToken<InjectableControl>(
  'ngx-injectable-control'
);

export function injectableControlProvider<T>(type: Type<T>): Provider {
  return {
    provide: NGX_INJECTABLE_CONTROL,
    useExisting: forwardRef(() => type),
  };
}
