// @hisab/pages/tool — the calculator page template (docs/adding-a-tool.md).
export * from './url-state.ts'
export * from './validation.ts'
export * from './verification.ts'
export * from './content.ts'
export * from './hooks.ts'
export type * from './types.ts'
export { ToolHeader } from './ToolHeader.tsx'
export { ToolActions, REPORT_ENDPOINT, type ToolActionsProps } from './ToolActions.tsx'
export {
  CalculatorFrame,
  ChoiceChips,
  FieldPair,
  InputCard,
  LabeledChips,
  ModeSwitch,
  RelatedTools,
  ResultEmpty,
  ResultError,
  SummaryCard,
  ToolCallout,
  ToolPage,
  ToolSteps,
  fieldMessages,
  type SummaryRow,
} from './parts.tsx'
export * from './say.ts'
export * from './text.ts'
export { islandText } from './island-text.ts'
export { CompareList } from './CompareList.tsx'
export { PickerField, type PickerFieldProps, type ChoiceOption } from './PickerField.tsx'
