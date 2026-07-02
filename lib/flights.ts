export type Flight = {
  id: string
  airline: string
  flightNumber: string
  origin: string
  originCode: string
  destination: string
  destinationCode: string
  departureTime: string
  arrivalTime: string
  duration: string
  price: number
  availableSeats: number
  aircraft: string
  promoCode?: string
  promoDiscount?: number
}

export type Seat = {
  id: string
  row: number
  column: string
  type: 'window' | 'middle' | 'aisle'
  class: 'economy' | 'premium' | 'business'
  available: boolean
  exitRow: boolean
  extraLegroom: boolean
  price: number
}

// Demo flights always depart "today" (in the local timezone of whoever is
// running the demo) so the data never quietly goes stale on stage.
function todayAt(hours: number, minutes: number): string {
  const d = new Date()
  d.setHours(hours, minutes, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

export const flights: Flight[] = [
  {
    id: 'AA-1102',
    airline: 'American Airlines',
    flightNumber: 'AA 1102',
    origin: 'San Francisco',
    originCode: 'SFO',
    destination: 'Chicago',
    destinationCode: 'ORD',
    departureTime: todayAt(8, 30),
    arrivalTime: todayAt(14, 45),
    duration: '4h 15m',
    price: 289,
    availableSeats: 14,
    aircraft: 'Boeing 737-800',
    promoCode: 'AIEWF15',
    promoDiscount: 15,
  },
  {
    id: 'UA-523',
    airline: 'United Airlines',
    flightNumber: 'UA 523',
    origin: 'San Francisco',
    originCode: 'SFO',
    destination: 'Chicago',
    destinationCode: 'ORD',
    departureTime: todayAt(11, 0),
    arrivalTime: todayAt(17, 10),
    duration: '4h 10m',
    price: 314,
    availableSeats: 6,
    aircraft: 'Boeing 757-200',
  },
  {
    id: 'AS-1382',
    airline: 'Alaska Airlines',
    flightNumber: 'AS 1382',
    origin: 'San Francisco',
    originCode: 'SFO',
    destination: 'Chicago',
    destinationCode: 'ORD',
    departureTime: todayAt(14, 45),
    arrivalTime: todayAt(20, 55),
    duration: '4h 10m',
    price: 272,
    availableSeats: 22,
    aircraft: 'Airbus A321neo',
    promoCode: 'AIEWF15',
    promoDiscount: 15,
  },
]

export function generateSeats(flightId: string): Seat[] {
  const seats: Seat[] = []
  const columns = ['A', 'B', 'C', 'D', 'E', 'F']

  for (let row = 1; row <= 30; row++) {
    for (const col of columns) {
      const isExitRow = row === 12 || row === 13
      const isBusinessClass = row <= 5
      const isPremiumClass = row >= 6 && row <= 10

      const colType: Seat['type'] =
        col === 'A' || col === 'F'
          ? 'window'
          : col === 'C' || col === 'D'
            ? 'aisle'
            : 'middle'

      const seatClass: Seat['class'] = isBusinessClass
        ? 'business'
        : isPremiumClass
          ? 'premium'
          : 'economy'

      // Some seats randomly unavailable
      const seed = (row * 6 + columns.indexOf(col) + flightId.charCodeAt(0)) % 7
      const available = seed !== 0

      let price = 0
      if (isBusinessClass) price = 85
      else if (isPremiumClass) price = 35
      else if (isExitRow) price = 25
      else if (colType === 'window') price = 15
      else price = 0

      seats.push({
        id: `${row}${col}`,
        row,
        column: col,
        type: colType,
        class: seatClass,
        available,
        exitRow: isExitRow,
        extraLegroom: isExitRow || isPremiumClass,
        price,
      })
    }
  }

  return seats
}

export function findFlights(origin: string, destination: string): Flight[] {
  const o = origin.toLowerCase()
  const d = destination.toLowerCase()
  return flights.filter(
    (f) =>
      (f.origin.toLowerCase().includes(o) || f.originCode.toLowerCase().includes(o)) &&
      (f.destination.toLowerCase().includes(d) ||
        f.destinationCode.toLowerCase().includes(d))
  )
}

export function getFlightById(id: string): Flight | undefined {
  return flights.find((f) => f.id === id)
}

export function applyPromo(flight: Flight, code: string): number {
  if (flight.promoCode && flight.promoCode.toUpperCase() === code.toUpperCase()) {
    return Math.round(flight.price * (1 - (flight.promoDiscount ?? 0) / 100))
  }
  return flight.price
}
