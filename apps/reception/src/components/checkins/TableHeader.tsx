// File: src/components/roomview/TableHeader.tsx

import React from 'react'

import {
  ReceptionTableHead,
  ReceptionTableHeader,
  ReceptionTableRow,
} from '@acme/ui/operations'

/**
 * Static table header row using Font Awesome icons only.
 * All text has been removed from header cells per request.
 */
const TableHeader: React.FC = () => {
  return (
    <ReceptionTableHeader className='sticky top-0 bg-surface-2 text-foreground border-b border-border-2 z-5 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface'>
      <ReceptionTableRow className='h-12'>
        {/* Guest Name */}
        <ReceptionTableHead className='px-4 py-2 w-200px font-semibold' title='Guest Name'>
          <div className='flex justify-center items-center'>
            <i className='fas fa-user' />
          </div>
        </ReceptionTableHead>

        {/* Room Allocated */}
        <ReceptionTableHead
          className='px-4 py-2 w-120px font-semibold'
          title='Room Allocated'
        >
          <div className='flex justify-center items-center'>
            <i className='fas fa-bed' />
          </div>
        </ReceptionTableHead>

        {/* Room Payment */}
        <ReceptionTableHead className='px-4 py-2 w-125px font-semibold' title='Room Payment'>
          <div className='flex justify-center items-center'>
            <i className='fas fa-credit-card' />
          </div>
        </ReceptionTableHead>

        {/* City Tax */}
        <ReceptionTableHead className='px-4 py-2 w-125px font-semibold' title='City Tax'>
          <div className='flex justify-center items-center'>
            <i className='fas fa-coins' />
          </div>
        </ReceptionTableHead>

        {/* Keycard Deposit */}
        <ReceptionTableHead
          className='px-4 py-2 w-125px font-semibold'
          title='Keycard Deposit'
        >
          <div className='flex justify-center items-center'>
            <i className='fas fa-key' />
          </div>
        </ReceptionTableHead>

        {/* Status */}
        <ReceptionTableHead className='px-4 py-2 w-120px font-semibold' title='Status'>
          <div className='flex justify-center items-center'>
            <i className='fas fa-clock' />
          </div>
        </ReceptionTableHead>

        {/* Document Insert */}
        <ReceptionTableHead
          className='px-4 py-2 w-150px font-semibold'
          title='Document Insert'
        >
          <div className='flex justify-center items-center'>
            <i className='fas fa-file-alt' />
          </div>
        </ReceptionTableHead>

        {/* Email Booking */}
        <ReceptionTableHead className='px-4 py-2 w-150px font-semibold' title='Email Booking'>
          <div className='flex justify-center items-center'>
            <i className='fas fa-envelope' />
          </div>
        </ReceptionTableHead>
      </ReceptionTableRow>
    </ReceptionTableHeader>
  )
}

export default TableHeader
