export const NOTE_LIMIT = 2000;

/** Do not report delivery unless the provider explicitly confirms it. */
export async function deliverAnonymousNote(endpoint: string, message: string, honey: string, signal: AbortSignal, request: typeof fetch = fetch) {
  const note = message.trim();
  if (!note || note.length > NOTE_LIMIT || honey) throw new Error('Invalid note');
  const response = await request(endpoint, {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ message: note, _subject: 'Anonymous note from Kal’s portfolio', _template: 'table', _honey: honey, _captcha: 'false' }),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error('Delivery was not confirmed');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || !('success' in result) || (result.success !== true && result.success !== 'true')) {
    throw new Error('Delivery was not confirmed');
  }
}
