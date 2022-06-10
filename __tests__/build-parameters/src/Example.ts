export default interface ExampleType {
  value: string;
  /**
   * @TJS-format email
   * @format email
   */
  email?: string;
  /**
   * @default 42
   */
  answer: number;
}

export class ExampleClass {
  value: string = '';
  /**
   * @TJS-format email
   * @format email
   */
  email?: string = '';
  /**
   * @default 42
   */
  answer: number = 42;
}

export type Foo = string;
