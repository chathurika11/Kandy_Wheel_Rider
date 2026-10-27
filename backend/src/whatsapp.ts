type BookingWhatsAppDetails = {
  bookingReference: string
  customerName: string
  customerNumber: string
  scooterName: string
  pickupDate: Date
  returnDate: Date
  totalAmount: number
}

export type WhatsAppDeliveryResult = {
  sent: boolean
  error?: string
}

type TemplateParameter = {
  type: 'text'
  text: string
}

function normalizeWhatsAppNumber(value: string) {
  const number = value.replace(/[^\d]/g, '')
  if (number.length < 8 || number.length > 15) throw new Error('WhatsApp recipient number must be in international format.')
  return number
}

function formatRentalDate(date: Date) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.WHATSAPP_TIME_ZONE || 'Asia/Colombo',
  }).format(date)
}

function textParameters(values: string[]): TemplateParameter[] {
  return values.map((text) => ({ type: 'text', text }))
}

async function sendTemplateMessage(recipient: string, templateName: string, parameters: string[]): Promise<WhatsAppDeliveryResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const language = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en'
  const apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION || 'v23.0'
  if (!accessToken || !phoneNumberId) {
    return { sent: false, error: 'WhatsApp Cloud API credentials are not configured.' }
  }

  try {
    const to = normalizeWhatsAppNumber(recipient)
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: [{ type: 'body', parameters: textParameters(parameters) }],
        },
      }),
    })
    const result = await response.json().catch(() => null) as { error?: { message?: string } } | null
    if (!response.ok) {
      return { sent: false, error: result?.error?.message || `WhatsApp API returned HTTP ${response.status}.` }
    }
    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : 'Unable to send WhatsApp template message.',
    }
  }
}

export async function sendBookingWhatsAppNotifications(details: BookingWhatsAppDetails) {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER
  const customerTemplate = process.env.WHATSAPP_CUSTOMER_TEMPLATE || 'kwr_booking_customer_confirmation'
  const adminTemplate = process.env.WHATSAPP_ADMIN_TEMPLATE || 'kwr_new_booking_admin'
  const amount = new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(details.totalAmount)
  const pickup = formatRentalDate(details.pickupDate)
  const returnDate = formatRentalDate(details.returnDate)

  const [customer, admin] = await Promise.all([
    sendTemplateMessage(details.customerNumber, customerTemplate, [
      details.customerName,
      details.bookingReference,
      details.scooterName,
      pickup,
      returnDate,
      `LKR ${amount}`,
    ]),
    adminNumber
      ? sendTemplateMessage(adminNumber, adminTemplate, [
        details.bookingReference,
        details.customerName,
        details.customerNumber,
        details.scooterName,
        pickup,
        returnDate,
        `LKR ${amount}`,
      ])
      : Promise.resolve({ sent: false, error: 'ADMIN_WHATSAPP_NUMBER is not configured.' }),
  ])

  return { customer, admin }
}
