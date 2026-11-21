import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasPendingApproval } from './chat-approvals.ts'

test('a pending starter approval blocks chat until a choice is made', () => {
  const tool = {
    type: 'tool-addToCalendar',
    toolCallId: 'calendar',
    input: { flightId: 'AS-1382' },
  }
  const assistant = { id: 'a1', role: 'assistant' }
  assert.equal(hasPendingApproval(undefined), false)
  assert.equal(hasPendingApproval({
    ...assistant, parts: [{ ...tool, state: 'approval-requested', approval: { id: 'approval' } }],
  }), true)
  for (const approved of [true, false]) {
    assert.equal(hasPendingApproval({
      ...assistant, parts: [{ ...tool, state: 'approval-responded', approval: { id: 'approval', approved } }],
    }), false)
  }
})
