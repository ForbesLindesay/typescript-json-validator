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
