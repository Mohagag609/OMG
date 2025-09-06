// Types matching the original JSON structure exactly

export interface Customer {
  id: string
  name: string
  phone: string
  nationalId?: string
  address?: string
  status: string
  notes?: string
}

export interface Unit {
  id: string
  code: string
  name?: string
  unitType: string
  area?: string
  floor?: string
  building?: string
  totalPrice: number
  status: string
  notes?: string
}

export interface Partner {
  id: string
  name: string
  phone?: string
  notes?: string
}

export interface UnitPartner {
  id: string
  unitId: string
  partnerId: string
  percentage: number
}

export interface Contract {
  id: string
  unitId: string
  customerId: string
  start: string
  totalPrice: number
  discountAmount: number
  brokerName?: string
  commissionSafeId?: string
  brokerAmount: number
}

export interface Installment {
  id: string
  unitId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
}

export interface Safe {
  id: string
  name: string
  balance: number
}

export interface Transfer {
  id: string
  fromSafeId: string
  toSafeId: string
  amount: number
  description?: string
}

export interface Voucher {
  id: string
  type: 'receipt' | 'payment'
  date: string
  amount: number
  safeId: string
  description: string
  payer?: string
  beneficiary?: string
  linked_ref?: string
}

export interface Broker {
  id: string
  name: string
  phone?: string
  notes?: string
}

export interface BrokerDue {
  id: string
  brokerId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
}

export interface PartnerGroup {
  id: string
  name: string
  notes?: string
}

export interface PartnerDebt {
  id: string
  partnerId: string
  amount: number
  dueDate: string
  status: string
  notes?: string
}

export interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  oldValues?: string
  newValues?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface Settings {
  theme: string
  font: number
  pass?: string
}

export interface AppState {
  customers: Customer[]
  units: Unit[]
  partners: Partner[]
  unitPartners: UnitPartner[]
  contracts: Contract[]
  installments: Installment[]
  safes: Safe[]
  transfers: Transfer[]
  auditLog: AuditLog[]
  vouchers: Voucher[]
  brokerDues: BrokerDue[]
  brokers: Broker[]
  partnerGroups: PartnerGroup[]
  settings: Settings
  locked: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination types
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Filter types
export interface DateFilter {
  from?: string
  to?: string
}

export interface UnitFilter extends DateFilter {
  status?: string
  unitType?: string
  building?: string
}

export interface CustomerFilter extends DateFilter {
  status?: string
}

export interface ContractFilter extends DateFilter {
  status?: string
}

// Calculation result types
export interface CalculationResult {
  totalSales: number
  totalReceipts: number
  totalDebt: number
  collectionPercentage: number
  totalExpenses: number
  netProfit: number
}

export interface UnitCounts {
  total: number
  available: number
  sold: number
  reserved: number
}

export interface DashboardKPIs extends CalculationResult {
  unitCounts: UnitCounts
  investorCount: number
}