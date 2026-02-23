'use client'

import {
  Button,
  type ButtonProps,
  Input,
  type InputProps,
  Table,
  TableBody,
  type TableBodyProps,
  TableCell,
  type TableCellProps,
  TableHead,
  TableHeader,
  type TableHeaderProps,
  type TableHeadProps,
  type TableProps,
  TableRow,
  type TableRowProps,
  Textarea,
  type TextareaProps,
} from '@acme/design-system/primitives'

export type ReceptionButtonProps = Omit<ButtonProps, 'compatibilityMode'>
export type ReceptionInputProps = Omit<InputProps, 'compatibilityMode'>
export type ReceptionTextareaProps = Omit<TextareaProps, 'compatibilityMode'>
export type ReceptionTableProps = Omit<TableProps, 'compatibilityMode'>

export function ReceptionButton(props: ReceptionButtonProps) {
  return <Button compatibilityMode='passthrough' {...props} />
}

export function ReceptionInput(props: ReceptionInputProps) {
  return <Input compatibilityMode='no-wrapper' {...props} />
}

export function ReceptionTextarea(props: ReceptionTextareaProps) {
  return <Textarea compatibilityMode='no-wrapper' {...props} />
}

export function ReceptionTable(props: ReceptionTableProps) {
  return <Table compatibilityMode='no-wrapper' {...props} />
}

export {
  TableBody as ReceptionTableBody,
  TableCell as ReceptionTableCell,
  TableHead as ReceptionTableHead,
  TableHeader as ReceptionTableHeader,
  TableRow as ReceptionTableRow,
}

export type {
  TableBodyProps as ReceptionTableBodyProps,
  TableCellProps as ReceptionTableCellProps,
  TableHeaderProps as ReceptionTableHeaderProps,
  TableHeadProps as ReceptionTableHeadProps,
  TableRowProps as ReceptionTableRowProps,
}
