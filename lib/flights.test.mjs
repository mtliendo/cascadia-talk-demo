import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyPromo, findFlights, generateSeats, getFlightById, getSeatUpgrade } from './flights.ts'

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

test('a simulated upgrade offers a matching, available exit-row seat for the held seat', () => {
  const flightId = 'AS-1382'
  const seats = generateSeats(flightId)
  for (const seatId of ['6C', '6F']) {
    const offer = getSeatUpgrade(flightId, seatId)
    assert.equal(offer.currentSeat, seatId)
    const offeredSeat = seats.find(seat => seat.id === offer.upgradeSeat)
    assert.equal(offeredSeat.type, seats.find(seat => seat.id === seatId).type)
    assert.ok(offeredSeat.exitRow && offeredSeat.available)
    assert.equal(getSeatUpgrade(flightId, offeredSeat.id), undefined)
  }
  assert.equal(getSeatUpgrade(flightId, '99C'), undefined)
  assert.equal(getSeatUpgrade('unknown-flight', '6C'), undefined)
})
