import { json } from 'remix'
import crypto from 'crypto'
import { getUserRole } from './session.server'

const webhookSecret = process.env.WEBHOOK_SECRET
if (!webhookSecret) {
  throw new Error('WEBHOOK_SECRET must be set')
}
export async function requireWebhookSignature(request: Request) {
  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed' }, 405)
  }

  const userRole = await getUserRole(request)
  if (userRole === 'admin') {
    return
  }

  const payload = await request.json()

  if (!webhookSecret) {
    throw json({ message: 'Internal server errors' }, 500)
  }

  const signature = request.headers.get('X-Hub-Signature-256')
  const generatedSignature = `sha256=${crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex')}`

  if (signature !== generatedSignature) {
    throw json({ message: 'Signature mismatch' }, 401)
  }
}
