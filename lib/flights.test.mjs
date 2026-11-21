import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyPromo, findFlights, getFlightById } from './flights.ts'

test('demo schedules use the departure city date and local wall times', () => {
  const flight = getFlightById('AA-1102', new Date('2026-11-22T03:00:00Z'))
  assert.equal(flight.departureTime, '2026-11-21T08:30:00')
  assert.equal(flight.arrivalTime, '2026-11-21T14:45:00')
})

test('search and promo use actual records from the demo catalog', () => {
  const flights = findFlights('SFO', 'Chicago')
  const alaska = flights.find(flight => flight.id === 'AS-1382')
  assert.equal(flights.length, 3)
  assert.equal(applyPromo(alaska, 'aiewf15'), 231)
  assert.equal(applyPromo(alaska, 'not-a-promo'), 272)
  assert.deepEqual(findFlights('SFO', 'LAX'), [])
})
