import 'dotenv/config'

import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient, BookingStatus, VehicleStatus } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()
const app = express()
const port = Number(process.env.PORT ?? 4000)
const uploadsPath = path.resolve(process.cwd(), 'uploads')
const vehicleUploadsPath = path.join(uploadsPath, 'vehicles')
const paymentUploadsPath = path.join(uploadsPath, 'payments')

for (const directory of [uploadsPath, vehicleUploadsPath, paymentUploadsPath]) {
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true })
}

app.use(cors())
app.use(express.json({ limit: '1mb' }))
app.use('/uploads/vehicles', express.static(vehicleUploadsPath))

const storage = multer.diskStorage({
  destination: (_request, file, callback) => {
    callback(null, file.fieldname === 'paymentSlip' ? paymentUploadsPath : vehicleUploadsPath)
  },
  filename: (_request, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
  fileFilter: (_request, file, callback) => {
    const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    const allowedTypes = file.fieldname === 'paymentSlip' ? [...imageMimeTypes, 'application/pdf'] : imageMimeTypes
    callback(null, allowedTypes.includes(file.mimetype))
  },
})

type AdminRequest = Request & { admin?: { id: string; email: string } }

function parseDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Please provide a valid date.')
  return date
}

function rentalDays(pickupDate: Date, returnDate: Date) {
  const days = Math.ceil((returnDate.getTime() - pickupDate.getTime()) / 86_400_000)
  if (days < 1) throw new Error('The return date must be at least one day after pickup.')
  return days
}

async function vehicleIsAvailable(vehicleId: string, pickupDate: Date, returnDate: Date, excludeBookingId?: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
  if (!vehicle || vehicle.status !== VehicleStatus.AVAILABLE) return false

  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      pickupDate: { lt: returnDate },
      returnDate: { gt: pickupDate },
      ...(excludeBookingId ? { NOT: { id: excludeBookingId } } : {}),
    },
  })

  return !conflictingBooking
}

function requireAdmin(request: AdminRequest, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  const secret = process.env.JWT_SECRET
  if (!token || !secret) return response.status(401).json({ message: 'Administrator authentication is required.' })

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    if (!payload.sub || typeof payload.email !== 'string') throw new Error('Invalid token')
    request.admin = { id: payload.sub, email: payload.email }
    next()
  } catch {
    return response.status(401).json({ message: 'Your administrator session has expired. Please sign in again.' })
  }
}

const vehicleInput = z.object({
  name: z.string().trim().min(2).max(80),
  brand: z.string().trim().min(2).max(60),
  model: z.string().trim().min(1).max(60),
  year: z.number().int().min(2000).max(2100),
  type: z.string().trim().min(2).max(40),
  description: z.string().trim().min(20).max(2000),
  dailyRate: z.number().positive(),
  engineCc: z.number().int().positive().max(2000),
  transmission: z.string().trim().min(2).max(40),
  seats: z.number().int().min(1).max(4),
  location: z.string().trim().min(2).max(100),
  status: z.nativeEnum(VehicleStatus).default(VehicleStatus.AVAILABLE),
  features: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
})

const bookingInput = z.object({
  customerName: z.string().trim().min(2).max(100),
  contactNumber: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(100),
  nicOrPassport: z.string().trim().max(50).optional(),
  pickupDate: z.string().min(8),
  returnDate: z.string().min(8),
  pickupLocation: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(600).optional(),
})

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/vehicles', async (request, response, next) => {
  try {
    const startDate = typeof request.query.startDate === 'string' ? parseDate(request.query.startDate) : undefined
    const endDate = typeof request.query.endDate === 'string' ? parseDate(request.query.endDate) : undefined
    if ((startDate && !endDate) || (!startDate && endDate)) {
      return response.status(400).json({ message: 'Please select both rental dates.' })
    }
    if (startDate && endDate) rentalDays(startDate, endDate)

    const vehicles = await prisma.vehicle.findMany({
      where: { status: VehicleStatus.AVAILABLE },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!startDate || !endDate) return response.json({ vehicles })

    const busyBookings = await prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        pickupDate: { lt: endDate },
        returnDate: { gt: startDate },
      },
      select: { vehicleId: true },
    })
    const busyVehicleIds = new Set(busyBookings.map((booking) => booking.vehicleId))
    return response.json({ vehicles: vehicles.filter((vehicle) => !busyVehicleIds.has(vehicle.id)) })
  } catch (error) {
    next(error)
  }
})

app.get('/api/vehicles/:vehicleId', async (request, response, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: request.params.vehicleId, status: VehicleStatus.AVAILABLE },
      include: { images: { orderBy: { sortOrder: 'asc' } } },
    })
    if (!vehicle) return response.status(404).json({ message: 'This scooter is no longer available.' })
    return response.json({ vehicle })
  } catch (error) {
    next(error)
  }
})

app.post('/api/bookings', upload.single('paymentSlip'), async (request, response, next) => {
  try {
    if (!request.file) return response.status(400).json({ message: 'Please attach your payment slip.' })
    const vehicleId = z.string().min(1).parse(request.body.vehicleId)
    const details = bookingInput.parse(request.body)
    const pickupDate = parseDate(details.pickupDate)
    const returnDate = parseDate(details.returnDate)
    const days = rentalDays(pickupDate, returnDate)

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle || !(await vehicleIsAvailable(vehicleId, pickupDate, returnDate))) {
      return response.status(409).json({ message: 'This scooter is not available for the selected dates.' })
    }

    const booking = await prisma.booking.create({
      data: {
        vehicleId,
        customerName: details.customerName,
        contactNumber: details.contactNumber,
        email: details.email,
        nicOrPassport: details.nicOrPassport || undefined,
        pickupDate,
        returnDate,
        pickupLocation: details.pickupLocation,
        notes: details.notes || undefined,
        totalAmount: days * vehicle.dailyRate,
        paymentSlipUrl: `/uploads/payments/${request.file.filename}`,
      },
      include: { vehicle: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
    })

    const { paymentSlipUrl: _paymentSlipUrl, ...customerBooking } = booking
    return response.status(201).json({ booking: customerBooking, bookingReference: `KWR-${booking.id.slice(-6).toUpperCase()}` })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/login', async (request, response, next) => {
  try {
    const credentials = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(request.body)
    const admin = await prisma.adminUser.findUnique({ where: { email: credentials.email.toLowerCase() } })
    if (!admin || !(await bcrypt.compare(credentials.password, admin.passwordHash))) {
      return response.status(401).json({ message: 'Incorrect email address or password.' })
    }
    const secret = process.env.JWT_SECRET
    if (!secret) return response.status(500).json({ message: 'JWT_SECRET is not configured on the server.' })
    const token = jwt.sign({ email: admin.email }, secret, { subject: admin.id, expiresIn: '12h' })
    return response.json({ token, admin: { email: admin.email } })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/vehicles', requireAdmin, async (_request, response, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: { images: { orderBy: { sortOrder: 'asc' } }, _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return response.json({ vehicles })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/vehicles', requireAdmin, async (request, response, next) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: vehicleInput.parse(request.body) })
    return response.status(201).json({ vehicle })
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/vehicles/:vehicleId', requireAdmin, async (request, response, next) => {
  try {
    const vehicleId = z.string().min(1).parse(request.params.vehicleId)
    const changes = vehicleInput.partial().parse(request.body)
    const vehicle = await prisma.vehicle.update({ where: { id: vehicleId }, data: changes })
    return response.json({ vehicle })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/vehicles/:vehicleId', requireAdmin, async (request, response, next) => {
  try {
    const vehicleId = z.string().min(1).parse(request.params.vehicleId)
    const bookingCount = await prisma.booking.count({ where: { vehicleId } })
    if (bookingCount) return response.status(409).json({ message: 'Vehicles with booking history cannot be deleted. Set them to inactive instead.' })
    await prisma.vehicleImage.deleteMany({ where: { vehicleId } })
    await prisma.vehicle.delete({ where: { id: vehicleId } })
    return response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/vehicles/:vehicleId/images', requireAdmin, upload.array('images', 8), async (request, response, next) => {
  try {
    const vehicleId = z.string().min(1).parse(request.params.vehicleId)
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })
    if (!vehicle) return response.status(404).json({ message: 'Vehicle not found.' })
    const files = request.files as Express.Multer.File[] | undefined
    if (!files?.length) return response.status(400).json({ message: 'Please select at least one JPEG, PNG, or WebP image.' })
    const currentImageCount = await prisma.vehicleImage.count({ where: { vehicleId: vehicle.id } })
    const images = await Promise.all(files.map((file, index) => prisma.vehicleImage.create({
      data: {
        vehicleId: vehicle.id,
        url: `/uploads/vehicles/${file.filename}`,
        alt: vehicle.name,
        sortOrder: currentImageCount + index,
      },
    })))
    return response.status(201).json({ images })
  } catch (error) {
    next(error)
  }
})

app.delete('/api/admin/vehicles/:vehicleId/images/:imageId', requireAdmin, async (request, response, next) => {
  try {
    const vehicleId = z.string().min(1).parse(request.params.vehicleId)
    const imageId = z.string().min(1).parse(request.params.imageId)
    const image = await prisma.vehicleImage.findFirst({ where: { id: imageId, vehicleId } })
    if (!image) return response.status(404).json({ message: 'Vehicle image not found.' })
    await prisma.vehicleImage.delete({ where: { id: image.id } })
    const filePath = path.resolve(uploadsPath, `.${image.url.replace('/uploads', '')}`)
    if (filePath.startsWith(uploadsPath) && existsSync(filePath)) unlinkSync(filePath)
    return response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/bookings', requireAdmin, async (_request, response, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: { vehicle: { include: { images: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { createdAt: 'desc' },
    })
    return response.json({ bookings })
  } catch (error) {
    next(error)
  }
})

app.get('/api/admin/bookings/:bookingId/payment-slip', requireAdmin, async (request, response, next) => {
  try {
    const bookingId = z.string().min(1).parse(request.params.bookingId)
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { paymentSlipUrl: true } })
    if (!booking) return response.status(404).json({ message: 'Booking not found.' })
    const filePath = path.resolve(paymentUploadsPath, path.basename(booking.paymentSlipUrl))
    if (!existsSync(filePath)) return response.status(404).json({ message: 'Payment slip file not found.' })
    return response.sendFile(filePath)
  } catch (error) {
    next(error)
  }
})

app.patch('/api/admin/bookings/:bookingId', requireAdmin, async (request, response, next) => {
  try {
    const bookingId = z.string().min(1).parse(request.params.bookingId)
    const change = z.object({
      status: z.nativeEnum(BookingStatus).optional(),
      adminNotes: z.string().trim().max(600).nullable().optional(),
    }).parse(request.body)
    const existing = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!existing) return response.status(404).json({ message: 'Booking not found.' })
    if (change.status === BookingStatus.CONFIRMED && !(await vehicleIsAvailable(existing.vehicleId, existing.pickupDate, existing.returnDate, existing.id))) {
      return response.status(409).json({ message: 'This scooter is no longer available for the requested dates.' })
    }
    const booking = await prisma.booking.update({ where: { id: existing.id }, data: change })
    return response.json({ booking })
  } catch (error) {
    next(error)
  }
})

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return response.status(400).json({ message: error.issues[0]?.message ?? 'Please check the submitted information.' })
  if (error instanceof multer.MulterError) return response.status(400).json({ message: error.message })
  if (error instanceof Error) {
    if (error.message.includes('ObjectId')) return response.status(404).json({ message: 'The requested record was not found.' })
    return response.status(400).json({ message: error.message })
  }
  return response.status(500).json({ message: 'An unexpected server error occurred.' })
})

async function bootstrap() {
  await prisma.$connect()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email && password) {
    const existingAdmin = await prisma.adminUser.findUnique({ where: { email } })
    if (!existingAdmin) {
      await prisma.adminUser.create({ data: { email, passwordHash: await bcrypt.hash(password, 12) } })
      console.info(`Created initial administrator account for ${email}`)
    }
  } else {
    console.warn('ADMIN_EMAIL and ADMIN_PASSWORD are not set; administrator login is unavailable.')
  }
  app.listen(port, () => console.info(`Kandy WheelRider API is running on http://localhost:${port}`))
}

bootstrap().catch((error) => {
  console.error('Unable to start Kandy WheelRider API.', error)
  process.exit(1)
})
