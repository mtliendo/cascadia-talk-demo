import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createGateway, streamText } from 'ai'
import {
  CHAT_CAPACITY_PAUSE_MS,
  CHAT_CAPACITY_REACHED,
  getChatCapacityPauseDeadline,
  getChatStreamError,
} from './chat-errors.ts'

test('a stored capacity pause keeps its original deadline across reloads', () => {
  const now = 1_000_000
  const deadline = now + CHAT_CAPACITY_PAUSE_MS
  const stored = String(deadline)

  assert.equal(getChatCapacityPauseDeadline(stored, now), deadline)
  assert.equal(getChatCapacityPauseDeadline(stored, deadline - 1), deadline)
  assert.equal(getChatCapacityPauseDeadline(stored, deadline), 0)
  assert.equal(getChatCapacityPauseDeadline(stored, deadline + 1), 0)
  assert.equal(getChatCapacityPauseDeadline(String(deadline + 1), now), 0)
  assert.equal(getChatCapacityPauseDeadline('invalid', now), 0)
  assert.equal(getChatCapacityPauseDeadline(null, now), 0)
})

test('the chat stream reports exhausted Gateway capacity without exposing provider details', async () => {
  for (const [status, type, expected] of [
    [402, 'quota_for_entity_exceeded', CHAT_CAPACITY_REACHED],
    [402, 'unrelated_payment_error', 'An error occurred.'],
    [500, 'quota_for_entity_exceeded', 'An error occurred.'],
  ]) {
    const gateway = createGateway({
      apiKey: 'test-key',
      fetch: async () => Response.json(
        { error: { type, message: 'Internal billing details' } },
        { status },
      ),
    })
    const response = streamText({
      model: gateway('test/model'),
      prompt: 'Find a flight',
      maxRetries: 0,
      onError: () => {},
    }).toUIMessageStreamResponse({ onError: getChatStreamError })

    assert.equal(response.status, 200)
    const body = await response.text()
    const chunks = body.split('\n').filter(line => line.startsWith('data: {')).map(line => JSON.parse(line.slice(6)))
    assert.deepEqual(chunks.find(chunk => chunk.type === 'error'), { type: 'error', errorText: expected })
    assert.doesNotMatch(body, /Internal billing details/)
  }
})
