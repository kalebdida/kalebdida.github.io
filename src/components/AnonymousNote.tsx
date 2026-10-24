import { lazy, Suspense, useEffect, useRef, useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { deliverAnonymousNote, NOTE_LIMIT } from '../utils/anonymousNotes';
const ParticleOrb = lazy(() => import('./ParticleOrb'));

export function AnonymousNote({ relayUrl, reducedMotion, theme }: { relayUrl: string; reducedMotion: boolean; theme: 'dark' | 'light' }) {
  const [message, setMessage] = useState('');
  const [honey, setHoney] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const active = useRef<AbortController | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [pulse, setPulse] = useState(0);
  const endpoint = relayUrl ? `${relayUrl.replace(/\/$/, '')}/notes` : '';
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (active.current || !endpoint || !message.trim()) return;
    const controller = new AbortController(); active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setStatus('sending');
    try {
      await deliverAnonymousNote(endpoint, message, honey, controller.signal);
      setMessage(''); setStatus('sent'); setPulse(value => value + 1);
    } catch { if (active.current === controller) setStatus('error'); }
    finally {
      clearTimeout(timeout); active.current = null;
      requestAnimationFrame(() => statusRef.current?.focus({ preventScroll: true }));
    }
  };
  return <div className="anonymous-note mt-12 max-w-3xl" data-reveal="up">
    <div className="note-form-heading"><div><h3 className="t-h3">Leave me an anonymous note.</h3><p className="t-ui text-ash mt-3">A thought, a question, or something I could do better. Just your words, sent privately to me.</p></div>{!reducedMotion && <Suspense fallback={<div className="particle-toy-placeholder" aria-hidden="true" />}><ParticleOrb theme={theme} pulse={pulse} /></Suspense>}</div>
    <form onSubmit={submit} method="post" aria-label="Anonymous note" className="mt-6">
      <label className="t-meta text-bone" htmlFor="anonymous-message">Your note</label>
      <textarea id="anonymous-message" name="message" className="note-textarea t-ui mt-3" placeholder="What’s on your mind?" value={message} onChange={event => { setMessage(event.target.value); if (status !== 'sending') setStatus('idle'); }} required minLength={1} maxLength={NOTE_LIMIT} rows={5} disabled={!endpoint || status === 'sending'} aria-describedby="note-privacy note-status" />
      <div className="note-honeypot" aria-hidden="true"><label htmlFor="note-website">Leave this empty</label><input id="note-website" name="_honey" tabIndex={-1} autoComplete="off" value={honey} onChange={event => setHoney(event.target.value)} /></div>
      <div className="note-form-actions mt-5">
        <button type="submit" className="send-note-button t-ui" disabled={!endpoint || status === 'sending' || !message.trim()}><Send size={17} aria-hidden="true" />{status === 'sending' ? 'Sending…' : 'Send anonymously'}</button>
      </div>
      <p id="note-privacy" className="t-meta text-ash mt-4">{endpoint ? 'No name or email required. Your note stays private.' : 'Anonymous notes are being connected. Please check back soon.'}</p>
      <p ref={statusRef} id="note-status" tabIndex={-1} className="note-status t-ui mt-4" role="status" aria-live="polite">{status === 'sent' ? 'Your note was sent. Thank you.' : status === 'error' ? 'I couldn’t confirm delivery. Your note is still here; please try again later.' : ''}</p>
    </form>
  </div>;
}
