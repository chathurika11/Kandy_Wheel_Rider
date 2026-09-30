export type VehicleStatus = 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'

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
  _count?: { bookings: number }
}

export interface Booking {
  id: string
  vehicleId: string
  customerName: string
  contactNumber: string
  email: string
  nicOrPassport?: string | null
  pickupDate: string
  returnDate: string
  pickupLocation: string
  notes?: string | null
  totalAmount: number
  paymentSlipUrl?: string
  status: BookingStatus
  adminNotes?: string | null
  createdAt: string
  vehicle: Vehicle
}

export interface BookingConfirmation {
  booking: Booking
  bookingReference: string
}
