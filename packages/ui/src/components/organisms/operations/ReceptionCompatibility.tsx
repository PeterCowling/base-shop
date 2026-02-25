'use client'

import * as React from 'react'

export type ReceptionInputProps = React.InputHTMLAttributes<HTMLInputElement>
export type ReceptionSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>
export type ReceptionTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>
export type ReceptionTableProps = React.TableHTMLAttributes<HTMLTableElement>
export type ReceptionTableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>
export type ReceptionTableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>
export type ReceptionTableRowProps = React.HTMLAttributes<HTMLTableRowElement>
export type ReceptionTableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>
export type ReceptionTableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>

export const ReceptionInput = React.forwardRef<
  HTMLInputElement,
  ReceptionInputProps
>(function ReceptionInput(props, ref) {
  return <input ref={ref} {...props} />
})

export const ReceptionSelect = React.forwardRef<
  HTMLSelectElement,
  ReceptionSelectProps
>(function ReceptionSelect(props, ref) {
  return <select ref={ref} {...props} />
})

export const ReceptionTextarea = React.forwardRef<
  HTMLTextAreaElement,
  ReceptionTextareaProps
>(function ReceptionTextarea(props, ref) {
  return <textarea ref={ref} {...props} />
})

export const ReceptionTable = React.forwardRef<
  HTMLTableElement,
  ReceptionTableProps
>(function ReceptionTable(props, ref) {
  return <table ref={ref} {...props} />
})

export const ReceptionTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  ReceptionTableHeaderProps
>(function ReceptionTableHeader(props, ref) {
  return <thead ref={ref} {...props} />
})

export const ReceptionTableBody = React.forwardRef<
  HTMLTableSectionElement,
  ReceptionTableBodyProps
>(function ReceptionTableBody(props, ref) {
  return <tbody ref={ref} {...props} />
})

export const ReceptionTableRow = React.forwardRef<
  HTMLTableRowElement,
  ReceptionTableRowProps
>(function ReceptionTableRow(props, ref) {
  return <tr ref={ref} {...props} />
})

export const ReceptionTableHead = React.forwardRef<
  HTMLTableCellElement,
  ReceptionTableHeadProps
>(function ReceptionTableHead(props, ref) {
  return <th ref={ref} {...props} />
})

export const ReceptionTableCell = React.forwardRef<
  HTMLTableCellElement,
  ReceptionTableCellProps
>(function ReceptionTableCell(props, ref) {
  return <td ref={ref} {...props} />
})
