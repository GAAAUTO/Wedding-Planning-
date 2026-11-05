import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInquiry, formatInquiry } from '../src/form.js';
const valid = { name: 'Jamie Lee', email: 'jamie@example.com', date: '', location: 'Still dreaming', guests: '80', budget: 'Still exploring', message: 'An intimate garden wedding with our favourite people.' };
test('accepts a complete inquiry without an exact wedding date', () => assert.deepEqual(validateInquiry(valid), {}));
test('requires the information needed to prepare an inquiry', () => assert.deepEqual(Object.keys(validateInquiry({})).sort(), ['name', 'email', 'location', 'budget', 'message'].sort()));
test('rejects invalid email, a past date and fractional or excessive guests', () => {
 assert.ok(validateInquiry({ ...valid, email: 'bad@address', date: '2000-01-01', guests: '2.5' }).email);
 assert.ok(validateInquiry({ ...valid, date: '2000-01-01' }).date);
 for (const guests of ['0', '-1', '1.5', '10001', 'hello']) assert.ok(validateInquiry({ ...valid, guests }).guests);
});
test('accepts future dates and optional guest count', () => assert.deepEqual(validateInquiry({ ...valid, date: '2099-01-01', guests: '' }), {}));
test('download includes entered details and explicitly states it was not sent', () => {
 const text = formatInquiry(valid);
 assert.match(text, /Jamie Lee/); assert.match(text, /jamie@example.com/); assert.match(text, /To be decided/); assert.match(text, /has not been sent/);
});
