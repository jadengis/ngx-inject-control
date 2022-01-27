# Ngx-Inject-Control

[![Build](https://github.com/jadengis/ng-inject-control/actions/workflows/test.yml/badge.svg)](https://github.com/jadengis/ng-inject-control/actions/workflows/test.yml)
[![Test](https://github.com/jadengis/ng-inject-control/actions/workflows/build.yml/badge.svg)](https://github.com/jadengis/ng-inject-control/actions/workflows/build.yml)
[![Lint](https://github.com/jadengis/ng-inject-control/actions/workflows/lint.yml/badge.svg)](https://github.com/jadengis/ng-inject-control/actions/workflows/lint.yml)

A painless and idiomatic way to create reusable form controls for Angular applications.

Battle-tested at [Ezfire](https://ezfire.io).

## Version

- For Angular >=12, please use ngx-inject-control 1.x.x. `npm install ngx-inject-control@1.0.0`

## Installation

npm:

```bash
npm install --save ngx-inject-control
```

Yarn

```bash
yarn add ngx-inject-control
```

## Features

- Reusable form components
- Idiomatic API
- Behaves like you expect
- Plays nicely with UI libraries (e.g. Angular Material)

## Usage

### Create an injectable control

To use `ngx-inject-control` you first need to create an `InjectableControl`. An `InjectableControl` is an Angular component with a property called `control` of type `AbstractControl`. Finally, the `InjectableControl` must provide itself with the `NGX_INJECTABLE_CONTROL` token.

For example, suppose you want to create a single email input you can use across you application.

#### Markup:

```html
<div class="email-container">
  <label for="email-input">Email</label>
  <input id="email-input" name="email" type="email" [formControl]="control" />
</div>
```

#### Component:

```typescript
import {
  InjectableControl,
  injectableControlProvider,
} from 'ngx-inject-control';

@Component({
  selector: 'app-email-input',
  templateUrl: '...',
  providers: [injectableControlProvider(EmailInputComponent)],
})
export class EmailInputComponent implements InjectableControl {
    constructor(private readonly fb: FormBuilder) {}

    readonly control = this.fb.control(null, [Validators.email]).
}
```

### Using an injectable control

#### Module:

```typescript
import { InjectControlModule } from 'ngx-inject-control';


@NgModule({
  declarations: [EmailInputComponent], // Injectable component must be in scope
  imports: [InjectControlModule],
})
```

#### Component:

```html
<form [formGroup]="group" (ngSubmit)="onSubmit()">
  <input name="name" type="text" formControlName="name" />
  <app-email-input injectControlName="email"></app-email-input>
  <button>Submit</button>
</form>
```

```typescript
@Component({
  selector: 'app-form',
  templateUrl: '...',
})
export class FormComponent {
  constructor(private readonly fb: FormBuilder) {}

  readonly group = this.fb.group({
    name: [null, Validators.required],
    email: [],
  });
}
```

On render, the `injectControlName` directive will replace the email field in `group` with the `control` field of `EmailInputComponent`. Validations are recomputed at the time of replacement.

### API

#### `InjectControlNameDirective`

| Input               | Type                 | Description                                          |
| ------------------- | -------------------- | ---------------------------------------------------- |
| `injectControlName` | `string` or `number` | The field or index to replace in the parent control. |
| `disable`           | `boolean`            | Enable or disable the injected control.              |

## License

MIT
