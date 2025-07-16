import '@testing-library/jest-dom'

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveFocus(): R
      toBeDisabled(): R
      toHaveValue(value: string | number): R
      toBeVisible(): R
      toBeChecked(): R
      toHaveClass(className: string): R
      toHaveStyle(property: string | object): R
      toHaveTextContent(text: string | RegExp): R
      toBeEmptyDOMElement(): R
      toBeInvalid(): R
      toBeValid(): R
      toBeRequired(): R
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R
      toHaveFormValues(values: Record<string, any>): R
      toHaveLoadingState(): R
    }
  }
} 