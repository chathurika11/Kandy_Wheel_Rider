export type VehicleStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE'
export type ServiceListingCategory = 'CAMPING_GADGET' | 'TOUR_GUIDE'
export type ServiceListingStatus = 'AVAILABLE' | 'UNAVAILABLE'

export interface VehicleImage {
  id: string
  url: string
  alt: string
  sortOrder: number
}

export interface Vehicle {
  id: string
  name: string
  brand: string
  model: string
  year: number
  type: string
  description: string
  dailyRate: number
  engineCc: number
  transmission: string
  seats: number
  location: string
  status: VehicleStatus
  features: string[]
  images: VehicleImage[]
}

export interface ServiceListingImage {
  id: string
  url: string
  alt: string
  sortOrder: number
}

export interface ServiceListing {
  id: string
  category: ServiceListingCategory
  name: string
  description: string
  price: number
  priceUnit: string
  details: string[]
  status: ServiceListingStatus
  images: ServiceListingImage[]
  createdAt: string
  updatedAt: string
}

export interface AdminAuditEntry {
  id: string
  adminId: string
  adminEmail: string
  action: string
  details: string | null
  createdAt: string
}
