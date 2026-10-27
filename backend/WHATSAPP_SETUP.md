# WhatsApp booking notifications

After the customer confirms the booking, the API saves it and sends an approved
WhatsApp template to the customer and the configured administrator. A WhatsApp
API failure does not undo the booking; the API logs the failure and the
confirmation page tells the customer that a notification could not be sent.

Set these values in the ignored `backend/.env` file. Keep the access token
private and never commit it:

```dotenv
ADMIN_WHATSAPP_NUMBER=+94719275522
WHATSAPP_PHONE_NUMBER_ID=your_cloud_api_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_cloud_api_access_token
WHATSAPP_CUSTOMER_TEMPLATE=kwr_booking_customer_confirmation
WHATSAPP_ADMIN_TEMPLATE=kwr_new_booking_admin
WHATSAPP_TEMPLATE_LANGUAGE=en
WHATSAPP_GRAPH_API_VERSION=v23.0
WHATSAPP_TIME_ZONE=Asia/Colombo
```

Create and get approval for these utility templates in WhatsApp Manager. Keep
the numbered body placeholders in the exact order shown; change the configured
template names or language to match the approved versions in your account.

Customer template body (six text parameters):

```text
Hi {{1}}, your booking request {{2}} for {{3}} has been received. Pickup: {{4}}. Return: {{5}}. Estimated total: {{6}}. We will review your payment proof and contact you.
```

Admin template body (seven text parameters):

```text
You have a new booking {{1}} from {{2}} ({{3}}). Scooter: {{4}}. Pickup: {{5}}. Return: {{6}}. Estimated total: {{7}}. Please review the request and payment proof.
```

Customers must enter their number in international format and agree to receive
WhatsApp booking updates before submitting a booking.
