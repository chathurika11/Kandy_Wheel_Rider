import type { AdminAuditEntry, ServiceListing, ServiceListingCategory, Vehicle, VehicleStatus } from './types'

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

export const api = {
  getVehicles: () => request<{ vehicles: Vehicle[] }>('/vehicles'),
  getListings: (category: ServiceListingCategory) => request<{ listings: ServiceListing[] }>(`/listings/${category}`),
  login: (email: string, password: string) => request<{ token: string; admin: { email: string } }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  logout: (token: string) => request<void>('/admin/logout', { method: 'POST', token }),
  getAdminAuditLogs: (token: string) => request<{ entries: AdminAuditEntry[] }>('/admin/audit-logs', { token }),
  getAdminVehicles: (token: string) => request<{ vehicles: Vehicle[] }>('/admin/vehicles', { token }),
  getAdminListings: (token: string, category: ServiceListingCategory) => request<{ listings: ServiceListing[] }>(`/admin/listings/${category}`, { token }),
  createListing: (token: string, category: ServiceListingCategory, listing: Omit<ServiceListing, 'id' | 'category' | 'images' | 'createdAt' | 'updatedAt'>) => request<{ listing: ServiceListing }>(`/admin/listings/${category}`, {
    method: 'POST', token, body: JSON.stringify(listing),
  }),
  updateListing: (token: string, id: string, changes: Partial<Omit<ServiceListing, 'id' | 'category' | 'images' | 'createdAt' | 'updatedAt'>>) => request<{ listing: ServiceListing }>(`/admin/listings/${id}`, {
    method: 'PATCH', token, body: JSON.stringify(changes),
  }),
  deleteListing: (token: string, id: string) => request<void>(`/admin/listings/${id}`, { method: 'DELETE', token }),
  uploadListingImages: (token: string, id: string, images: File[]) => {
    const form = new FormData()
    images.forEach((image) => form.append('listingImages', image))
    return request(`/admin/listings/${id}/images`, { method: 'POST', token, body: form })
  },
  deleteListingImage: (token: string, listingId: string, imageId: string) => request<void>(`/admin/listings/${listingId}/images/${imageId}`, { method: 'DELETE', token }),
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
}

export function assetUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url
  if (/^https?:\/\//.test(apiBaseUrl)) return new URL(url, apiBaseUrl).toString()
  return url
}

export const statusLabels: Record<VehicleStatus, string> = {
  AVAILABLE: 'Available',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactive',
}
