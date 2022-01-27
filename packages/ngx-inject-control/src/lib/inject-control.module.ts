import { NgModule } from '@angular/core';
import { InjectControlNameDirective } from './inject-control-name.directive';

@NgModule({
  declarations: [InjectControlNameDirective],
  exports: [InjectControlNameDirective],
})
export class InjectControlModule {}
