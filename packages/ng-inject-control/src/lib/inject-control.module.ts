import { NgModule } from '@angular/core';
import { InjectControlDirective } from './inject-control.directive';

@NgModule({
  declarations: [InjectControlDirective],
  exports: [InjectControlDirective],
})
export class InjectControlModule {}
