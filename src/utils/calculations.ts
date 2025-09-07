import { Installment, Voucher, Contract, Unit } from '../types'
import { roundToTwo } from './formatting'

// Calculate remaining amount for a unit
export const calculateRemaining = (unit: Unit, installments: Installment[], contract?: Contract): number => {
  if (!contract) return 0

  const totalOwed = (contract.totalPrice || 0) - (contract.discountAmount || 0)
  const paidAmount = installments
    .filter(i => i.unitId === unit.id)
    .reduce((sum, i) => sum + i.amount, 0)

  return roundToTwo(totalOwed - paidAmount)
}

// Calculate installment status based on payments
export const calculateInstallmentStatus = (
  installment: Installment,
  vouchers: Voucher[]
): string => {
  const paidAmount = vouchers
    .filter(v => v.linked_ref === installment.unitId && v.type === 'receipt')
    .reduce((sum, v) => sum + v.amount, 0)

  if (paidAmount === 0) return 'معلق'
  if (paidAmount < installment.amount) return 'جزئي'
  if (paidAmount >= installment.amount) return 'مدفوع'

  return 'معلق'
}

// Calculate collection percentage
export const calculateCollectionPercentage = (
  totalSales: number,
  totalReceipts: number
): number => {
  if (totalSales === 0) return 0
  return roundToTwo((totalReceipts / totalSales) * 100)
}

// Calculate net profit
export const calculateNetProfit = (
  totalReceipts: number,
  totalExpenses: number
): number => {
  return roundToTwo(totalReceipts - totalExpenses)
}

// Calculate total sales from contracts
export const calculateTotalSales = (contracts: Contract[]): number => {
  return roundToTwo(
    contracts.reduce((sum, contract) => sum + (contract.totalPrice || 0), 0)
  )
}

// Calculate total receipts from vouchers
export const calculateTotalReceipts = (vouchers: Voucher[]): number => {
  return roundToTwo(
    vouchers
      .filter(v => v.type === 'receipt')
      .reduce((sum, v) => sum + v.amount, 0)
  )
}

// Calculate total expenses from vouchers
export const calculateTotalExpenses = (vouchers: Voucher[]): number => {
  return roundToTwo(
    vouchers
      .filter(v => v.type === 'payment')
      .reduce((sum, v) => sum + v.amount, 0)
  )
}

// Calculate total debt across all units
export const calculateTotalDebt = (
  units: Unit[],
  installments: Installment[]
): number => {
  return roundToTwo(
    units.reduce((sum, unit) => sum + calculateRemaining(unit, installments), 0)
  )
}

// Calculate unit counts by status
export const calculateUnitCounts = (units: Unit[]) => {
  return {
    total: units.length,
    available: units.filter(u => u.status === 'متاحة').length,
    sold: units.filter(u => u.status === 'مباعة').length,
    reserved: units.filter(u => u.status === 'محجوزة').length
  }
}

// Calculate overdue installments
export const calculateOverdueInstallments = (
  installments: Installment[],
  vouchers: Voucher[]
): Installment[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return installments.filter(installment => {
    const dueDate = new Date(installment.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    
    const isOverdue = dueDate < today
    const isNotPaid = calculateInstallmentStatus(installment, vouchers) !== 'مدفوع'
    
    return isOverdue && isNotPaid
  })
}

// Calculate due soon installments (next 7 days)
export const calculateDueSoonInstallments = (
  installments: Installment[],
  vouchers: Voucher[]
): Installment[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  return installments.filter(installment => {
    const dueDate = new Date(installment.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    
    const isDueSoon = dueDate >= today && dueDate <= nextWeek
    const isNotPaid = calculateInstallmentStatus(installment, vouchers) !== 'مدفوع'
    
    return isDueSoon && isNotPaid
  })
}