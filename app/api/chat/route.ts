import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { auth0 } from '@/lib/auth0'
import { findFlights, getFlightById, generateSeats, applyPromo } from '@/lib/flights'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: Request) {
  const session = await auth0.getSession()
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: `You are FlightMind, an AI flight booking assistant. You help users find and book flights from San Francisco to Chicago (the demo route).

You have access to tools for searching flights, holding bookings, adding calendar events, finding promo codes, initiating payments, and handling seat upgrades.

Key behaviors:
- Always search for flights before booking
- Before booking, ask about seat preferences if not provided (this is Demo 1: AI SDK Interrupt)
- When adding to Google Calendar, the user may need to connect their account first — tell them to visit /settings if you get a permission error (this is Demo 2: Token Vault)
- For payment, always look for a promo code first, then initiate the Stripe Link flow (Demo 3)
- Seat upgrades are handled via CIBA push (Demo 4) — only surface this when prompted

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
          try {
            const { token } = await auth0.getAccessTokenForConnection({
              connection: 'google-oauth2',
            })
            return { connected: true, hasToken: !!token }
          } catch {
            return {
              connected: false,
              message:
                'Google Calendar is not connected. Ask the user to visit /settings to connect their account.',
            }
          }
        },
      }),

      addToCalendar: tool({
        description: 'Add a flight to the user Google Calendar',
        inputSchema: z.object({
          flightId: z.string(),
          title: z.string(),
          description: z.string(),
        }),
        execute: async ({ flightId, title, description }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }

          let token: string
          try {
            ;({ token } = await auth0.getAccessTokenForConnection({
              connection: 'google-oauth2',
            }))
          } catch {
            return {
              success: false,
              error: 'Google Calendar not connected',
              action: 'Please visit /settings to connect your Google account.',
            }
          }

          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
          const response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/primary/events',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                summary: title,
                description,
                start: { dateTime: flight.departureTime, timeZone },
                end: { dateTime: flight.arrivalTime, timeZone },
              }),
            }
          )

          if (!response.ok) {
            return {
              success: false,
              error: `Google Calendar API error (${response.status})`,
              details: await response.text(),
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
        description: 'Initiate a Stripe Link payment request for the user to approve',
        inputSchema: z.object({
          flightId: z.string(),
          amount: z.number().describe('Final amount in USD after any discounts'),
          promoCode: z.string().optional(),
        }),
        execute: async ({ flightId, amount, promoCode }) => {
          const flight = getFlightById(flightId)
          if (!flight) return { error: 'Flight not found' }

          return {
            paymentInitiated: true,
            stripeSessionId: `cs_demo_${Math.random().toString(36).slice(2, 10)}`,
            amount,
            promoApplied: !!promoCode,
            promoCode,
            message:
              'Payment request sent via Stripe Link. Waiting for your approval to complete the transaction.',
            status: 'pending_approval',
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
              'Exit row assignment carries safety responsibilities. Confirmation required via Auth0 CIBA.',
          }
        },
      }),

      initiateSeatsUpgradeCIBA: tool({
        description:
          'Trigger Auth0 CIBA flow to confirm an exit row seat upgrade via email + Guardian push',
        inputSchema: z.object({
          confirmationCode: z.string(),
          upgradeSeat: z.string(),
        }),
        execute: async ({ confirmationCode, upgradeSeat }) => {
          return {
            cibaInitiated: true,
            confirmationCode,
            upgradeSeat,
            channels: ['email', 'guardian_push'],
            message:
              'Auth0 CIBA initiated. An email and Guardian push notification have been sent. Waiting for your approval…',
            status: 'pending',
          }
        },
      }),
    },
  })

  return result.toUIMessageStreamResponse()
}
