import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormArray,
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
import { InjectControlNameDirective } from './inject-control-name.directive';
import { InjectableControl } from './injectable-control.model';
import { injectableControlProvider } from './injectable-control.token';

type Person = {
  name: string;
  ages: string;
}

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

@Component({
  selector: 'ng-injectable-form-2',
  template: `
    <div [formGroup]="control">
      <input id="name-input-2" type="text" formControlName="name" />
    </div>
  `,
  providers: [injectableControlProvider(InjectableFormTwoComponent)],
})
class InjectableFormTwoComponent implements InjectableControl {
  constructor(private readonly fb: FormBuilder) {}
  readonly control = this.fb.group({
    name: ['', Validators.required],
  });
}

@Component({
  selector: 'ng-composite-form',
  template: `
    <div [formGroup]="control">
      <select id="type-select" formControlName="type">
        <option value="foo">Foo</option>
        <option value="bar">Bar</option>
      </select>
      <ng-container [ngSwitch]="type">
        <ng-injectable-form
          *ngSwitchCase="'foo'"
          injectControlName="person"
        ></ng-injectable-form>
        <ng-injectable-form-2
          *ngSwitchCase="'bar'"
          injectControlName="person"
        ></ng-injectable-form-2>
      </ng-container>
    </div>
  `,
  providers: [injectableControlProvider(CompositeFormComponent)],
})
class CompositeFormComponent implements InjectableControl {
  constructor(private readonly fb: FormBuilder) {}
  readonly control = this.fb.group({
    type: this.fb.nonNullable.control("", Validators.required),
    person: this.fb.control<Person | null>(null),
  });

  get type(): string {
    return this.control.value.type as string;
  }
}

describe(InjectControlNameDirective.name, () => {
  let spectator: SpectatorDirective<InjectControlNameDirective>;
  const createDirective = createDirectiveFactory({
    directive: InjectControlNameDirective,
    declarations: [
      InjectableFormComponent,
      InjectableFormTwoComponent,
      CompositeFormComponent,
    ],
    imports: [CommonModule, ReactiveFormsModule],
  });

  describe('with FormGroups', () => {
    let fg: FormGroup;

    beforeEach(() => {
      fg = new FormGroup({
        person: new FormControl(),
        other: new FormControl(),
      });
    });

    describe('with enabled subcontrol', () => {
      beforeEach(() => {
        spectator = createDirective(
          `<form [formGroup]="control">
        <ng-injectable-form [injectControlName]="target"></ng-injectable-form>
      </form>`,
          {
            hostProps: {
              control: fg,
              target: 'person',
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

      describe('when changing input', () => {
        it('should create an instance', async () => {
          const name = 'Robert Speedwagon';
          const age = '23';
          expect(fg.valid).toEqual(false);

          spectator.typeInElement(name, '#name-input');
          expect(fg.value.person.name).toEqual(name);
          expect(fg.valid).toEqual(false);

          spectator.typeInElement(age, '#age-input');
          expect(fg.value.person.age).toEqual(age);
          expect(fg.valid).toEqual(true);

          spectator.setHostInput({ target: 'other' });
          spectator.detectChanges();
          await spectator.fixture.whenStable();
          expect(fg.value.other.name).toEqual(name);
          expect(fg.value.other.age).toEqual(age);
          expect(fg.value.person).toBeFalsy();
        });
      });
    });

    describe('with disabled injected control', () => {
      beforeEach(() => {
        spectator = createDirective(
          `<form [formGroup]="control">
        <ng-injectable-form injectControlName="person" [disabled]="true"></ng-injectable-form>
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
      describe('that matches expected format', () => {
        beforeEach(() => {
          fg = new FormGroup({
            person: new FormControl({ name: 'Bobo', age: '25' }),
          });
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-injectable-form injectControlName="person"></ng-injectable-form>
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

      describe('that is missing values', () => {
        beforeEach(() => {
          fg = new FormGroup({
            person: new FormControl({ name: 'Bobo' }),
          });
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-injectable-form injectControlName="person"></ng-injectable-form>
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
          expect(spectator.query('#age-input')).toContainValue('');
        });
      });

      describe('that have too many values', () => {
        beforeEach(() => {
          fg = new FormGroup({
            person: new FormControl({ name: 'Bobo', age: 25, height: 200 }),
          });
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-injectable-form injectControlName="person"></ng-injectable-form>
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
        <ng-injectable-form injectControlName="person"></ng-injectable-form>
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
        <ng-injectable-form injectControlName="p"></ng-injectable-form>
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

    describe('in a composite form', () => {
      describe('with empty form group', () => {
        beforeEach(() => {
          fg = new FormGroup({
            data: new FormControl(),
          });
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-composite-form injectControlName="data"></ng-composite-form>
      </form>`,
            {
              hostProps: {
                control: fg,
              },
            }
          );
        });

        it('type dependent controls should not be visible', () => {
          expect(spectator.query('#name-input')).toBeFalsy();
          expect(spectator.query('#age-input')).toBeFalsy();
          expect(spectator.query('#name-input-2')).toBeFalsy();
        });

        it('should be able to display subcontrols', async () => {
          const select = spectator.query('#type-select') as HTMLSelectElement;
          spectator.selectOption(select, 'foo');
          await spectator.fixture.whenStable();
          expect(fg.valid).toEqual(false);

          const name = 'Robert Speedwagon';
          const age = '23';
          expect(fg.valid).toEqual(false);

          spectator.typeInElement(name, '#name-input');
          expect(fg.value.data.person.name).toEqual(name);
          expect(fg.valid).toEqual(false);

          spectator.typeInElement(age, '#age-input');
          expect(fg.value.data.person.age).toEqual(age);
          expect(fg.valid).toEqual(true);
          // console.logNgHTML(spectator.debugElement);
        });
      });

      describe('with a populated form', () => {
        beforeEach(async () => {
          fg = new FormGroup({
            data: new FormControl({
              type: 'foo',
              person: {
                name: 'Robert',
                age: 25,
              },
            }),
          });
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-composite-form injectControlName="data"></ng-composite-form>
      </form>`,
            {
              hostProps: {
                control: fg,
              },
            }
          );
        });

        it('type dependent controls should be visible', async () => {
          spectator.detectChanges();
          await spectator.fixture.whenStable();
          spectator.detectChanges();
          const select = spectator.query('#type-select') as HTMLSelectElement;
          expect(select.value).toEqual('foo');
          const nameInput = spectator.query('#name-input') as HTMLInputElement;
          const ageInput = spectator.query('#age-input') as HTMLInputElement;
          expect(nameInput).toBeTruthy();
          expect(ageInput).toBeTruthy();
          expect(nameInput.value).toEqual('Robert');
          expect(ageInput.value).toEqual('25');
        });

        it('should be able to switch form elements', async () => {
          spectator.detectChanges();
          await spectator.fixture.whenStable();
          spectator.detectChanges();
          const select = spectator.query('#type-select') as HTMLSelectElement;
          spectator.selectOption(select, 'bar');
          await spectator.fixture.whenStable();
          expect(spectator.query('#name-input')).toBeFalsy();
          expect(spectator.query('#age-input')).toBeFalsy();
          const name = spectator.query('#name-input-2') as HTMLSelectElement;
          expect(name.value).toEqual('Robert');
          expect(name.disabled).toEqual(false);
        });
      });

      describe('with a disabled form', () => {
        beforeEach(async () => {
          fg = new FormGroup({
            data: new FormControl({
              type: 'foo',
              person: {
                name: 'Robert',
                age: 25,
              },
            }),
          });
          fg.disable();
          spectator = createDirective(
            `<form [formGroup]="control">
        <ng-composite-form injectControlName="data"></ng-composite-form>
      </form>`,
            {
              hostProps: {
                control: fg,
              },
            }
          );
        });

        it('should be able to switch and stay disabled', async () => {
          spectator.detectChanges();
          await spectator.fixture.whenStable();
          spectator.detectChanges();
          const select = spectator.query('#type-select') as HTMLSelectElement;
          spectator.selectOption(select, 'bar');
          await spectator.fixture.whenStable();
          expect(spectator.query('#name-input')).toBeFalsy();
          expect(spectator.query('#age-input')).toBeFalsy();
          const name = spectator.query('#name-input-2') as HTMLSelectElement;
          expect(name.disabled).toEqual(true);
        });
      });
    });
  });

  describe('with FormArrays', () => {
    let fg: FormGroup;
    let fa: FormArray;

    beforeEach(() => {
      fa = new FormArray([new FormControl()]);
      fg = new FormGroup({
        array: fa,
      });
    });

    describe('with enabled subcontrol', () => {
      beforeEach(() => {
        spectator = createDirective(
          `<form [formGroup]="control">
            <ng-container formArrayName="array">
              <ng-injectable-form [injectControlName]="0"></ng-injectable-form>
            </ng-container>
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
          expect(fa.valid).toEqual(false);

          spectator.typeInElement(name, '#name-input');
          expect(fa.value[0].name).toEqual(name);
          expect(fa.valid).toEqual(false);

          spectator.typeInElement(age, '#age-input');
          expect(fa.value[0].age).toEqual(age);
          expect(fa.valid).toEqual(true);
        });
      });
    });
  });
});
