# 1.0.0

### BREAKING CHANGES

- Rename library from `ng-inject-control` to `ngx-inject-control` to better match community patterns.
- Rename `injectControl` directive to `injectControlName` directive to better match `@angular/forms` API.
- Update README.md to describe the library

# 0.3.0

### Features

- Upgrade library to support Angular 13
- Support for `FormArray` parents
- Support for changing input value

# 0.2.0

### Fixes

- Fixes an issue where disabled states were not copied from correctly from the original control. May be breaking.

# 0.1.2

### Fixes

- Fixes an issue with `ExpressionChangedAfterCheckedError` being thrown when working with nested forms.

# 0.1.1

### Fixes

- Replaced `setValue` with `patchValue` when copying existing values to stop erroring out.

# 0.1.0

### Features

- Initial release
