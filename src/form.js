export function validateInquiry(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Please tell us your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim() || '')) errors.email = 'Please enter a valid email address.';
  if (values.date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selected = new Date(`${values.date}T00:00:00`);
    if (!Number.isFinite(selected.getTime()) || selected < today) errors.date = 'Please choose today or a future date.';
  }
  if (!values.location?.trim()) errors.location = 'Add a location, or enter “still dreaming”.';
  if (values.guests && (!/^\d+$/.test(values.guests) || Number(values.guests) < 1 || Number(values.guests) > 10000)) errors.guests = 'Please enter between 1 and 10,000 guests.';
  if (!values.budget) errors.budget = 'Please select a budget range, or “still exploring”.';
  if (!values.message?.trim()) errors.message = 'Tell us a little about the celebration you imagine.';
  return errors;
}

export function formatInquiry(values) {
  return `EVER AFTER EVENTS — CONSULTATION REQUEST\n\nName: ${values.name.trim()}\nEmail: ${values.email.trim()}\nWedding date: ${values.date || 'To be decided'}\nLocation: ${values.location.trim()}\nGuest count: ${values.guests || 'To be decided'}\nBudget: ${values.budget}\n\nYour vision:\n${values.message.trim()}\n\nThis is a locally prepared inquiry. It has not been sent to Ever After Events.`;
}
