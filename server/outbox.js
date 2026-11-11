export async function processOutbox(state, deliver, { maxAttempts = 5, now = Date.now() } = {}) {
  const receipts = [];
  for (const event of state.outbox.filter((item) => item.status === "ready" || item.status === "retry")) {
    try {
      await deliver(event, event.idempotencyKey);
      event.status = "processed"; event.processedAt = new Date(now).toISOString();
      receipts.push({ id: event.id, status: "processed" });
    } catch (error) {
      event.attempts += 1;
      event.lastError = error instanceof Error ? error.message : "delivery-failed";
      event.status = event.attempts >= maxAttempts ? "dead-letter" : "retry";
      receipts.push({ id: event.id, status: event.status });
    }
  }
  return receipts;
}
