import type { Booking, BookingConfirmation, BookingStatus, Vehicle, VehicleStatus } from './types'

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api'

type RequestOptions = RequestInit & { token?: string }

async function request<T>(path: string, { token, headers, ...options }: RequestOptions = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => ({ message: 'The server returned an unexpected response.' }))
  if (!response.ok) throw new Error(body.message || 'Unable to complete your request.')
  return body as T
}

async function downloadPaymentSlip(token: string, bookingId: string) {
  const response = await fetch(`${apiBaseUrl}/admin/bookings/${bookingId}/payment-slip`, { headers: { Authorization: `Bearer ${token}` } })
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Unable to open the payment slip.' }))
    throw new Error(body.message || 'Unable to open the payment slip.')
  }
  return response.blob()
}

export const api = {
  getVehicles: (pickupDate?: string, returnDate?: string) => {
    const params = new URLSearchParams()
    if (pickupDate && returnDate) {
      params.set('startDate', pickupDate)
      params.set('endDate', returnDate)
    }
    return request<{ vehicles: Vehicle[] }>(`/vehicles${params.size ? `?${params}` : ''}`)
  },
  getVehicle: (id: string) => request<{ vehicle: Vehicle }>(`/vehicles/${id}`),
  createBooking: (form: FormData) => request<BookingConfirmation>('/bookings', { method: 'POST', body: form }),
  login: (email: string, password: string) => request<{ token: string; admin: { email: string } }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  getAdminVehicles: (token: string) => request<{ vehicles: Vehicle[] }>('/admin/vehicles', { token }),
  createVehicle: (token: string, vehicle: Omit<Vehicle, 'id' | 'images'>) => request<{ vehicle: Vehicle }>('/admin/vehicles', {
    method: 'POST', token, body: JSON.stringify(vehicle),
  }),
  updateVehicle: (token: string, id: string, changes: Partial<Vehicle>) => request<{ vehicle: Vehicle }>(`/admin/vehicles/${id}`, {
    method: 'PATCH', token, body: JSON.stringify(changes),
  }),
  deleteVehicle: (token: string, id: string) => request<void>(`/admin/vehicles/${id}`, { method: 'DELETE', token }),
  uploadVehicleImages: (token: string, id: string, images: File[]) => {
    const form = new FormData()
    images.forEach((image) => form.append('images', image))
    return request(`/admin/vehicles/${id}/images`, { method: 'POST', token, body: form })
  },
  deleteVehicleImage: (token: string, vehicleId: string, imageId: string) => request<void>(`/admin/vehicles/${vehicleId}/images/${imageId}`, { method: 'DELETE', token }),
  getBookings: (token: string) => request<{ bookings: Booking[] }>('/admin/bookings', { token }),
  getPaymentSlip: (token: string, bookingId: string) => downloadPaymentSlip(token, bookingId),
  updateBooking: (token: string, id: string, status: BookingStatus) => request<{ booking: Booking }>(`/admin/bookings/${id}`, {
    method: 'PATCH', token, body: JSON.stringify({ status }),
  }),
}

export function assetUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url
  if (/^https?:\/\//.test(apiBaseUrl)) return new URL(url, apiBaseUrl).toString()
  return url
}

export const statusLabels: Record<VehicleStatus | BookingStatus, string> = {
  AVAILABLE: 'Available',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactive',
  PENDING: 'Pending review',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}
