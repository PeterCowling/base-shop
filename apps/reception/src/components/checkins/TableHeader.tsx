// File: src/components/roomview/TableHeader.tsx

import React from 'react'
import { Bed, Clock, Coins, CreditCard, FileText, Key, Mail, User } from 'lucide-react'

import { TableHead, TableHeader as DSTableHeader, TableRow } from '@acme/design-system'

/**
 * Static table header row using Lucide icons.
 * All text has been removed from header cells per request.
 */
const TableHeader: React.FC = () => {
  return (
    <DSTableHeader className='sticky top-0 bg-surface-2 text-foreground border-b border-border-2 z-5'>
      <TableRow className='h-12'>
        {/* Guest Name */}
        <TableHead className='px-4 py-2 w-200px font-semibold' title='Guest Name'>
          <div className='flex justify-center items-center'>
            <User size={16} />
          </div>
        </TableHead>

        {/* Room Allocated */}
        <TableHead
          className='px-4 py-2 w-120px font-semibold'
          title='Room Allocated'
        >
          <div className='flex justify-center items-center'>
            <Bed size={16} />
          </div>
        </TableHead>

        {/* Room Payment */}
        <TableHead className='px-4 py-2 w-125px font-semibold' title='Room Payment'>
          <div className='flex justify-center items-center'>
            <CreditCard size={16} />
          </div>
        </TableHead>

        {/* City Tax */}
        <TableHead className='px-4 py-2 w-125px font-semibold' title='City Tax'>
          <div className='flex justify-center items-center'>
            <Coins size={16} />
          </div>
        </TableHead>

        {/* Keycard Deposit */}
        <TableHead
          className='px-4 py-2 w-125px font-semibold'
          title='Keycard Deposit'
        >
          <div className='flex justify-center items-center'>
            <Key size={16} />
          </div>
        </TableHead>

        {/* Status */}
        <TableHead className='px-4 py-2 w-120px font-semibold' title='Status'>
          <div className='flex justify-center items-center'>
            <Clock size={16} />
          </div>
        </TableHead>

        {/* Document Insert */}
        <TableHead
          className='px-4 py-2 w-150px font-semibold'
          title='Document Insert'
        >
          <div className='flex justify-center items-center'>
            <FileText size={16} />
          </div>
        </TableHead>

        {/* Email Booking */}
        <TableHead className='px-4 py-2 w-150px font-semibold' title='Email Booking'>
          <div className='flex justify-center items-center'>
            <Mail size={16} />
          </div>
        </TableHead>
      </TableRow>
    </DSTableHeader>
  )
}

export default TableHeader
