# TypeScript JSON Validator

Automatically generate a validator using JSON Schema and AJV for any TypeScript type.

## Usage

Define a type in `src/Example.ts`, e.g.:

```ts
export default interface ExampleType {
  value: string;
  /**
   * @TJS-format email
   */
  email?: string;
  /**
   * @default 42
   */
  answer: number;
}
```

To generate a validator, run:

```
npx typescript-json-validator src/Example.ts ExampleType
```

This will generate `src/Example.validator.ts`, which you can use:

```ts
import {readFileSync} from 'fs';
import validate from './Example.validator.ts';

const value: unknown = JSON.parse(readFileSync(process.argv[2], 'utf8'));

// this will through a clear error if `value` is not of the
// correct type. It will also fill in any default values
const validatedValue = validate(value);

console.log(validatedValue.value);
```

Note that types will be validated automatically, but you can also use annotations to add extra runtime checks, such as e-mail formatting. For annotations see: https://github.com/YousefED/typescript-json-schema#annotations

## CLI Docs

<!-- USAGE -->

```
Usage: typescript-json-schema <path-to-typescript-file> <type>

Options:
  --help                Show help                                      [boolean]
  --version             Show version number                            [boolean]
  --refs                Create shared ref definitions. [boolean] [default: true]
  --aliasRefs           Create shared ref definitions for the type aliases.
                                                      [boolean] [default: false]
  --topRef              Create a top-level ref definition.
                                                      [boolean] [default: false]
  --titles              Creates titles in the output schema.
                                                      [boolean] [default: false]
  --defaultProps        Create default properties definitions.
                                                       [boolean] [default: true]
  --noExtraProps        Disable additional properties in objects by default.
                                                      [boolean] [default: false]
  --propOrder           Create property order definitions.
                                                      [boolean] [default: false]
  --typeOfKeyword       Use typeOf keyword (https://goo.gl/DC6sni) for
                        functions.                    [boolean] [default: false]
  --required            Create required array for non-optional properties.
                                                       [boolean] [default: true]
  --strictNullChecks    Make values non-nullable by default.
                                                       [boolean] [default: true]
  --ignoreErrors        Generate even if the program has errors.
                                                      [boolean] [default: false]
  --validationKeywords  Provide additional validation keywords to include.
                                                           [array] [default: []]
  --excludePrivate      Exclude private members from the schema.
                                                      [boolean] [default: false]
  --uniqueNames         Use unique names for type symbols.
                                                      [boolean] [default: false]
  --include             Further limit tsconfig to include only matching files.
                                                                         [array]
  --rejectDateType      Rejects Date fields in type definitions.
                                                      [boolean] [default: false]
  --id                  ID of schema.                     [string] [default: ""]
  --uniqueItems         Validate `uniqueItems` keyword [boolean] [default: true]
  --unicode             calculate correct length of strings with unicode pairs
                        (true by default). Pass false to use .length of strings
                        that is faster, but gives "incorrect" lengths of strings
                        with unicode pairs - each unicode pair is counted as two
                        characters.                    [boolean] [default: true]
  --nullable            support keyword "nullable" from Open API 3
                        specification.                 [boolean] [default: true]
  --format              formats validation mode ('fast' by default). Pass 'full'
                        for more correct and slow validation or false not to
                        validate formats at all. E.g., 25:00:00 and 2015/14/33
                        will be invalid time and date in 'full' mode but it will
                        be valid in 'fast' mode.
                                     [choices: "fast", "full"] [default: "fast"]
  --coerceTypes         Change data type of data to match type keyword. e.g.
                        parse numbers in strings      [boolean] [default: false]
  --collection          Process the file as a collection of types, instead of
                        one single type.              [boolean] [default: false]
  --useNamedExport      Type name is a named export, rather than the default
                        export of the file            [boolean] [default: false]
  -*                                                               [default: []]

```

<!-- USAGE -->

## License

MIT
