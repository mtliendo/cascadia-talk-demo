import { createHash, createHmac } from 'node:crypto'
import { streamText, tool, convertToModelMessages, stepCountIs, gateway, type UIMessage } from 'ai'
import { z } from 'zod'
import { auth0, getGoogleToken } from '@/lib/auth0'
import { findFlights, getFlightById, generateSeats, applyPromo } from '@/lib/flights'

export async function POST(req: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!req.headers.get('content-type')?.startsWith('application/json')) {
    return Response.json({ error: 'Expected JSON' }, { status: 415 })
  }
  const raw = await req.text()
  if (raw.length > 100_000) {
    return Response.json({ error: 'Clear the chat to start a new trip.' }, { status: 413 })
  }
  let messages: UIMessage[]
  try {
    ({ messages } = JSON.parse(raw))
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('Missing messages')
  } catch {
    return Response.json({ error: 'Invalid messages' }, { status: 400 })
  }

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4.6'),
    maxOutputTokens: 1200,
    experimental_toolApprovalSecret: createHmac('sha256', process.env.AUTH0_SECRET!)
      .update(`flightmind-approval:${session.user.sub}`)
      .digest('hex'),
    system: `You are FlightMind, an AI flight booking assistant. You help users find and book flights from San Francisco to Chicago (the demo route).

You have access to tools for searching flights, holding bookings, adding calendar events, finding promo codes, initiating payments, and handling seat upgrades.

Key behaviors:
- Always search for flights before booking
- Before holding a flight, ask the user for a seat preference if they have not provided one or selected a seat. Do not choose for them.
- When adding to Google Calendar, use checkGoogleCalendar first. If disconnected, tell the user to open Settings in a separate tab, connect Google, then return and retry.
- For a demo payment, look for a promo code first, then request in-app approval. This simulates Stripe Link; never say anything was sent to Stripe or that money moved.
- Only surface a simulated seat upgrade when prompted. Its in-app approval demonstrates where CIBA/Guardian would fit; no email or push is sent.
- Never retry a tool execution the user denied.

Be conversational, helpful, and transparent about what you're doing and why you're stopping to ask.`,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      searchFlights: tool({
        description: 'Search for available flights between two cities',
        inputSchema: z.object({
          origin: z.string().describe('Origin city or airport code'),
          destination: z.string().describe('Destination city or airport code'),
        }),
        execute: async ({ origin, destination }) => {
          const flights = findFlights(origin, destination)
          if (flights.length === 0) {
            return { flights: [], message: 'No flights found for this route.' }
          }
          return { flights }
        },
      }),

      getSeats: tool({
        description: 'Get the seat map for a specific flight',
        inputSchema: z.object({
          flightId: z.string().describe('The flight ID'),
        }),
        execute: async ({ flightId }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }
          const seats = generateSeats(flightId)
          return { seats: seats.slice(0, 60) }
        },
      }),

      bookFlight: tool({
        description: 'Hold/book a flight for the user with a selected seat',
        inputSchema: z.object({
          flightId: z.string().describe('The flight ID to book'),
          seatId: z.string().describe('The selected seat ID (e.g. "14C")'),
          seatPreference: z
            .enum(['window', 'middle', 'aisle'])
            .optional()
            .describe('Seat type preference if no specific seat chosen'),
        }),
        execute: async ({ flightId, seatId, seatPreference }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }

          const seat = generateSeats(flightId).find(seat => seat.id === seatId)
          if (!seat?.available || (seatPreference && seat.type !== seatPreference)) {
            return { error: 'That seat is unavailable or does not match the requested preference.' }
          }

          const holdExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

          return {
            success: true,
            booking: {
              confirmationCode: `FM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
              flight,
              seatId,
              seatPreference,
              status: 'held',
              holdExpiry,
              message: `Flight held until ${new Date(holdExpiry).toLocaleDateString()}. Payment required to confirm.`,
            },
          }
        },
      }),

      checkGoogleCalendar: tool({
        description: "Check if the user's Google Calendar is connected via Token Vault",
        inputSchema: z.object({}),
        execute: async () => {
          const google = await getGoogleToken()
          return 'token' in google
            ? { connected: true }
            : {
              connected: false,
              message:
                'Google Calendar is not connected. Ask the user to visit /settings to connect their account.',
            }
        },
      }),

      addToCalendar: tool({
        description: 'Add a flight to the user Google Calendar',
        needsApproval: true,
        inputSchema: z.object({
          flightId: z.string(),
          title: z.string(),
          description: z.string(),
        }),
        execute: async ({ flightId, title, description }, { toolCallId }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }

          const google = await getGoogleToken()
          if (!('token' in google)) {
            return {
              success: false,
              error: 'Google Calendar not connected',
              action: 'Please visit /settings to connect your Google account.',
            }
          }

          const eventId = createHash('sha256').update(JSON.stringify([session.user.sub, toolCallId])).digest('hex')
          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${google.token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                id: eventId,
                summary: title,
                description,
                start: { dateTime: flight.departureTime, timeZone: 'America/Los_Angeles' },
                end: { dateTime: flight.arrivalTime, timeZone: 'America/Chicago' },
              }),
            }
          )

          if (response.status === 409) {
            return { success: true, message: 'This approved flight is already on your Google Calendar.' }
          }
          if (!response.ok) {
            return {
              success: false,
              error: `Google Calendar API error (${response.status})`,
            }
          }

          const event = await response.json()

          return {
            success: true,
            event: {
              id: event.id,
              htmlLink: event.htmlLink,
              title,
              start: flight.departureTime,
              end: flight.arrivalTime,
              description,
            },
            message: 'Flight added to your Google Calendar.',
          }
        },
      }),

      findPromoCode: tool({
        description: 'Search for applicable promo codes for a flight',
        inputSchema: z.object({
          flightId: z.string(),
        }),
        execute: async ({ flightId }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { promoFound: false }

          if (flight.promoCode) {
            const discountedPrice = applyPromo(flight, flight.promoCode)
            return {
              promoFound: true,
              code: flight.promoCode,
              discount: flight.promoDiscount,
              originalPrice: flight.price,
              discountedPrice,
              savings: flight.price - discountedPrice,
            }
          }

          return { promoFound: false, message: 'No promo codes available for this flight.' }
        },
      }),

      initiatePayment: tool({
        description: 'Request approval for a simulated Stripe Link payment. No money moves.',
        needsApproval: true,
        inputSchema: z.object({
          flightId: z.string(),
          promoCode: z.string().optional(),
        }),
        execute: async ({ flightId, promoCode }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }

          return {
            simulated: true,
            amount: promoCode ? applyPromo(flight, promoCode) : flight.price,
            message: 'Demo payment approved. No Stripe request or charge was made.',
          }
        },
      }),

      checkSeatUpgrade: tool({
        description: 'Check if the airline has offered a seat upgrade for the booking',
        inputSchema: z.object({
          confirmationCode: z.string(),
        }),
        execute: async ({ confirmationCode }) => {
          return {
            upgradeAvailable: true,
            confirmationCode,
            currentSeat: '27B',
            upgradeSeat: '13C',
            upgradeType: 'Exit row — extra legroom',
            reason: 'Loyalty program perk',
            requiresConfirmation: true,
            message:
              'Exit row assignment carries safety responsibilities. The simulated upgrade requires approval.',
          }
        },
      }),

      initiateSeatsUpgradeCIBA: tool({
        description: 'Request approval for a simulated CIBA seat upgrade. No notification is sent.',
        needsApproval: true,
        inputSchema: z.object({
          confirmationCode: z.string(),
          upgradeSeat: z.string(),
        }),
        execute: async ({ confirmationCode, upgradeSeat }) => {
          return {
            simulated: true,
            confirmationCode,
            upgradeSeat,
            message: 'Demo upgrade approved. No CIBA email or Guardian push was sent.',
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
