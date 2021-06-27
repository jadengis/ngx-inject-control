import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  SpectatorDirective,
  createDirectiveFactory,
} from '@ngneat/spectator/jest';
import { InjectControlDirective } from './inject-control.directive';
import { InjectableControl } from './injectable-control.model';
import { injectableControlProvider } from './injectable-control.token';

@Component({
  selector: 'ng-injectable-form',
  template: `
    <div [formGroup]="control">
      <input id="name-input" type="text" formControlName="name" />
      <input id="age-input" formControlName="age" />
    </div>
  `,
  providers: [injectableControlProvider(InjectableFormComponent)],
})
class InjectableFormComponent implements InjectableControl {
  constructor(private readonly fb: FormBuilder) {}
  readonly control = this.fb.group({
    name: ['', Validators.required],
    age: ['', Validators.required],
  });
}

describe('InjectControlDirective', () => {
  let fg: FormGroup;
  let spectator: SpectatorDirective<InjectControlDirective>;
  const createDirective = createDirectiveFactory({
    directive: InjectControlDirective,
    declarations: [InjectableFormComponent],
    imports: [ReactiveFormsModule],
  });

  beforeEach(() => {
    fg = new FormGroup({
      person: new FormControl(),
    });
  });

  describe('with enabled subcontrol', () => {
    beforeEach(() => {
      spectator = createDirective(
        `<form [formGroup]="control">
        <ng-injectable-form injectControl="person"></ng-injectable-form>
      </form>`,
        {
          hostProps: {
            control: fg,
          },
        }
      );
    });

    describe('when inputting data', () => {
      it('should create an instance', () => {
        const name = 'Robert Speedwagon';
        const age = '23';
        expect(fg.valid).toEqual(false);

        spectator.typeInElement(name, '#name-input');
        expect(fg.value.person.name).toEqual(name);
        expect(fg.valid).toEqual(false);

        spectator.typeInElement(age, '#age-input');
        expect(fg.value.person.age).toEqual(age);
        expect(fg.valid).toEqual(true);
      });
    });
  });

  describe('with disabled injected control', () => {
    beforeEach(() => {
      spectator = createDirective(
        `<form [formGroup]="control">
        <ng-injectable-form injectControl="person" [disabled]="true"></ng-injectable-form>
      </form>`,
        {
          hostProps: {
            control: fg,
          },
        }
      );
    });

    it('should maybe the injected control as disabled', () => {
      expect(fg.controls.person.disabled).toEqual(true);
    });
  });

  describe('with existing value', () => {
    beforeEach(() => {
      fg = new FormGroup({
        person: new FormControl({ name: 'Bobo', age: '25' }),
      });
      spectator = createDirective(
        `<form [formGroup]="control">
        <ng-injectable-form injectControl="person"></ng-injectable-form>
      </form>`,
        {
          hostProps: {
            control: fg,
          },
        }
      );
    });

    it('should copy the value to the injected control', () => {
      expect(spectator.query('#name-input')).toContainValue('Bobo');
      expect(spectator.query('#age-input')).toContainValue('25');
      expect(fg.valid).toEqual(true);
    });
  });

  describe('with existing validators', () => {
    function alwaysBadValidator(): ValidationErrors | null {
      return { alwaysBad: true };
    }

    beforeEach(() => {
      fg = new FormGroup({
        person: new FormControl(
          { name: 'Bobo', age: '25' },
          alwaysBadValidator
        ),
      });
      spectator = createDirective(
        `<form [formGroup]="control">
        <ng-injectable-form injectControl="person"></ng-injectable-form>
      </form>`,
        {
          hostProps: {
            control: fg,
          },
        }
      );
    });

    it('should copy over the validator', () => {
      expect(spectator.query('#name-input')).toContainValue('Bobo');
      expect(spectator.query('#age-input')).toContainValue('25');
      expect(fg.valid).toEqual(false);
    });
  });

  describe('with formGroup missing control', () => {
    it('should throw an error', () => {
      expect(() =>
        createDirective(
          `<form [formGroup]="control">
        <ng-injectable-form injectControl="p"></ng-injectable-form>
      </form>`,
          {
            hostProps: {
              control: fg,
            },
          }
        )
      ).toThrowError(Error);
    });
  });
});
