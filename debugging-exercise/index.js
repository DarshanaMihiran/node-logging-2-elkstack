import winston from 'winston'

/* Custom error to know when a user complains */
class UserComplainedError extends Error {
  constructor (message, userId) {
    super(message)
    this.name = 'UserComplainedError'
    this.userId = userId
  }
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.json()),
  transports: [
    new winston.transports.File({ filename: '../elk-stack/microservice-logs/debugging.log' })
  ]
})

const increaseTimestamp = (timestamp, ms) => new Date(timestamp.getTime() + ms)
const increaseTimestampRand = (timestamp, ms) => increaseTimestamp(timestamp, Math.random() * ms)

/* Helper function to simulate price calculation */
function calculatePrice (numTickets) {
  return numTickets * (Math.random() * 50 + 20).toFixed(2)
}

/* Helper function to generate random event categories */
function generateCategory () {
  const categories = ['music', 'sports', 'theater', 'conference']
  return categories[Math.floor(Math.random() * categories.length)]
}

/* Log factory for different services, levels and requests */
const log = (correlationId, level, service) => ({ timestamp, ...other }) => {
  const logObject = {
    level,
    service,
    correlationId,
    timestamp: timestamp.toISOString(),
    ...other
  }
  if (other.method) {
    logObject.responseTime = parseFloat((Math.random() * 1000).toFixed(2))
  }
  if (other.err) {
    logObject.message = other.err.message
    logObject.stackTrace = other.err.stack
  }
  logger.log(logObject)
}

const FRONT_END_ACTION_DELAY_MS = 25_000
const TICKET_TIMEOUT_DELAY_MS = 10_000
const NETWORK_DELAY_MS = 1_000
const QUEUE_DELAY_MS = 15_000

/* Simulate user action in the Front End */
function frontEnd () {
  let timestamp = new Date(new Date().getTime() - (5 + Math.random()) * FRONT_END_ACTION_DELAY_MS)

  try {
    const userId = logIn({ correlationId: crypto.randomUUID(), timestamp })

    timestamp = increaseTimestampRand(timestamp, FRONT_END_ACTION_DELAY_MS)
    const category = generateCategory()
    const eventIds = searchEvents({ correlationId: crypto.randomUUID(), timestamp, category })
    timestamp = increaseTimestampRand(timestamp, FRONT_END_ACTION_DELAY_MS)
    for (const eventId of eventIds) {
      getEvent({ correlationId: crypto.randomUUID(), timestamp, eventId })
    }
    const eventId = eventIds[Math.floor(Math.random() * eventIds.length)]
    const numTickets = Math.floor(Math.random() * 5) + 1

    timestamp = increaseTimestampRand(timestamp, FRONT_END_ACTION_DELAY_MS)
    purchaseTickets({ correlationId: crypto.randomUUID(), timestamp, userId, eventId, numTickets })
  } catch (err) {
    if (err instanceof UserComplainedError) {
      console.log(`User ${err.userId} complained, charged but did not receive tickets`)
    }
  }
}

/* Simulate Auth Service login endpoint */
function logIn ({ correlationId, timestamp }) {
  timestamp = increaseTimestampRand(timestamp, NETWORK_DELAY_MS)
  const info = log(correlationId, 'info', 'auth-service')
  const error = log(correlationId, 'error', 'auth-service')

  const userId = crypto.randomUUID()
  if (Math.random() < 0.02) {
    const err = new Error('Failed login - Invalid credentials')
    error({ timestamp, err })
    info({ timestamp, message: 'HTTP request', method: 'POST', url: '/login', status: 401 })
    throw err
  }
  info({ timestamp, message: 'User logged in', userId })
  info({ timestamp, message: 'HTTP request', method: 'POST', url: '/login', status: 200 })
  return userId
}

/* Simulate Event Service /events endpoint */
function searchEvents ({ correlationId, timestamp, category }) {
  timestamp = increaseTimestampRand(timestamp, NETWORK_DELAY_MS)
  const info = log(correlationId, 'info', 'event-service')
  const error = log(correlationId, 'error', 'event-service')

  if (Math.random() < 0.01) {
    const err = new Error('Error searching for events - database query timed out')
    error({ timestamp, err })
    info({ timestamp, message: 'HTTP request', method: 'GET', url: `/events?category=${category}`, status: 500 })
    throw err
  }
  const eventIds = []
  for (let i = 0; i < Math.random() * 10; i++) {
    eventIds.push(crypto.randomUUID())
  }
  info({ timestamp, message: `Found ${eventIds.length} events`, category })
  info({ timestamp, message: 'HTTP request', method: 'GET', url: `/events?category=${category}`, status: 200 })
  return eventIds
}

/* Simulate Event Service /events endpoint */
function getEvent ({ correlationId, timestamp, eventId }) {
  timestamp = increaseTimestampRand(timestamp, NETWORK_DELAY_MS)
  const info = log(correlationId, 'info', 'event-service')
  const error = log(correlationId, 'error', 'event-service')

  if (Math.random() < 0.01) {
    const err = new Error('Error fetching event details - database query timed out')
    error({ timestamp, err })
    info({ timestamp, message: 'HTTP request', method: 'GET', url: `/events/${eventId}`, status: 500 })
    throw err
  }
  info({ timestamp, message: 'Fetched event details', eventId })
  info({ timestamp, message: 'HTTP request', method: 'GET', url: `/events/${eventId}`, status: 200 })
}

/* Simulate Ticket Service */
function purchaseTickets ({ correlationId, timestamp, userId, eventId, numTickets }) {
  timestamp = increaseTimestampRand(timestamp, NETWORK_DELAY_MS)
  const info = log(correlationId, 'info', 'ticket-service')
  const warn = log(correlationId, 'warn', 'ticket-service')

  info({ timestamp, message: `Checking availability for ${numTickets} tickets`, eventId })
  info({ timestamp, message: 'HTTP request', method: 'GET', url: `/availability?eventId=${eventId}&numTickets=${numTickets}`, status: 200 })

  if (Math.random() < 0.8) {
    info({ timestamp, message: `Reserved ${numTickets} tickets`, eventId, userId })
    info({ timestamp, message: 'HTTP request', method: 'POST', url: '/tickets/reserve', status: 200, body: { eventId, numTickets, userId } })
    timestamp = increaseTimestampRand(timestamp, TICKET_TIMEOUT_DELAY_MS)
    if (Math.random() < 0.7) {
      info({ timestamp, message: `Purchased ${numTickets} tickets`, eventId, userId })
      info({ timestamp, message: 'HTTP request', method: 'POST', url: '/tickets/purchase', status: 200, body: { eventId, numTickets, userId } })
    } else {
      timestamp = increaseTimestamp(timestamp, TICKET_TIMEOUT_DELAY_MS)
      warn({ timestamp, message: `Released hold on ${numTickets} tickets after timeout`, eventId, userId })
      throw new Error('User did not purchase tickets')
    }
  } else {
    warn({ timestamp, message: 'Tickets not available', eventId })
    throw new Error('Tickets not available')
  }

  info({ timestamp, message: 'Creating purchase event', eventId, userId, numTickets })
  createOrder({ correlationId, timestamp, userId, eventId, numTickets })
}

/* Simulate Order Service */
function createOrder ({ correlationId, timestamp, userId, eventId, numTickets }) {
  timestamp = increaseTimestampRand(timestamp, QUEUE_DELAY_MS)
  const info = log(correlationId, 'info', 'order-service')
  const error = log(correlationId, 'error', 'order-service')

  info({ timestamp, message: 'Processing purchase event', eventId, userId, numTickets })
  if (Math.random() < 0.03) {
    const err = new Error('Error creating order - could not hold lock on database table')
    error({ timestamp, err })
    throw err
  }

  const orderId = crypto.randomUUID()
  info({ timestamp, message: 'Created Order', orderId })

  const amount = calculatePrice(numTickets)
  info({ orderId, timestamp, message: 'Initiating payment', amount, userId, eventId })
  processPayment({ correlationId, timestamp, orderId, amount, userId, eventId })
}

/* Simulate Billing Service */
function processPayment ({ correlationId, timestamp, orderId, amount, userId, eventId }) {
  timestamp = increaseTimestampRand(timestamp, NETWORK_DELAY_MS)
  const info = log(correlationId, 'info', 'billing-service')
  const error = log(correlationId, 'error', 'billing-service')

  if (Math.random() < 0.03) {
    const err = new Error('Payment failed - insufficient funds')
    error({ orderId, timestamp, err })
    info({ orderId, timestamp, message: 'HTTP request', method: 'POST', url: '/payment', status: 500, body: { orderId, amount, userId, eventId } })
    throw err
  }
  info({ orderId, timestamp, message: 'Payment successful', userId, eventId })
  info({ orderId, timestamp, message: 'HTTP request', method: 'POST', url: '/payment', status: 200, body: { orderId, amount, userId, eventId } })
  info({ orderId, timestamp, message: 'Creating Payment successful event' })
  sendNotification({ correlationId, timestamp, orderId, userId, eventId })
}

/* Simulate Notification Service */
function sendNotification ({ correlationId, timestamp, orderId, userId, eventId }) {
  timestamp = increaseTimestampRand(timestamp, QUEUE_DELAY_MS)
  const info = log(correlationId, 'info', 'notification-service')
  const error = log(correlationId, 'error', 'notification-service')

  info({ orderId, timestamp, message: 'Processing Payment successful event' })
  if (Math.random() < 0.03) {
    const err = new UserComplainedError('Order confirmation failed - Email service returned 429, too many requests error', userId)
    error({ orderId, timestamp, err, eventId })
    throw err
  }
  info({ orderId, timestamp, message: 'Order confirmation sent', userId })
}

/* Simulate many users using the application */
for (let i = 0; i < 300; i++) {
  frontEnd()
}

setTimeout(() => {
  logger.close()
  console.log('Sent logs to file')
}, 1000)
