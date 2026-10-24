import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { deliverAnonymousNote, NOTE_LIMIT } from '../utils/anonymousNotes';

export function AnonymousNote({ email, reducedMotion }: { email: string; reducedMotion: boolean }) {
  const [message, setMessage] = useState('');
  const [honey, setHoney] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const active = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);
  const spark = () => { if (!reducedMotion) window.dispatchEvent(new Event('kal:contact-spark')); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (active.current || !message.trim()) return;
    const controller = new AbortController(); active.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setStatus('sending');
    try {
      await deliverAnonymousNote(endpoint, message, honey, controller.signal);
      setMessage(''); setStatus('sent'); spark();
    } catch { if (active.current === controller) setStatus('error'); }
    finally {
      clearTimeout(timeout); active.current = null;
      requestAnimationFrame(() => statusRef.current?.focus({ preventScroll: true }));
    }
  };
  return <div className="anonymous-note mt-12 max-w-3xl" data-reveal="up">
    <div className="note-form-heading"><div><h3 className="t-h3">Leave me an anonymous note.</h3><p className="t-ui text-ash mt-3">A thought, a question, or something I could do better. Just your words, sent privately to me.</p></div></div>
    <form ref={formRef} onSubmit={submit} action={`https://formsubmit.co/${encodeURIComponent(email)}`} method="post" target="_blank" aria-label="Anonymous note" className="mt-6">
      <input type="hidden" name="_subject" value="Anonymous note from Kal’s portfolio" />
      <label className="t-meta text-bone" htmlFor="anonymous-message">Your note</label>
      <textarea id="anonymous-message" name="message" className="note-textarea t-ui mt-3" placeholder="What’s on your mind?" value={message} onChange={event => { setMessage(event.target.value); if (status !== 'sending') setStatus('idle'); }} required minLength={1} maxLength={NOTE_LIMIT} rows={5} disabled={status === 'sending'} aria-describedby="note-privacy note-status" />
      <div className="note-honeypot" aria-hidden="true"><label htmlFor="note-website">Leave this empty</label><input id="note-website" name="_honey" tabIndex={-1} autoComplete="off" value={honey} onChange={event => setHoney(event.target.value)} /></div>
      <div className="note-form-actions mt-5">
        <button type="submit" className="send-note-button t-ui" disabled={status === 'sending' || !message.trim()}><Send size={17} aria-hidden="true" />{status === 'sending' ? 'Sending…' : 'Send anonymously'}</button>
        {!reducedMotion && <button type="button" className="spark-button t-meta link-quiet" onClick={spark}><Sparkles size={17} aria-hidden="true" />Send a spark</button>}
      </div>
      <p id="note-privacy" className="t-meta text-ash mt-4">No name or email required. Delivered by <a href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer" className="link-quiet">FormSubmit</a>.</p>
      <p ref={statusRef} id="note-status" tabIndex={-1} className="note-status t-ui mt-4" role="status" aria-live="polite">{status === 'sent' ? 'Your note was sent. Thank you.' : status === 'error' ? 'I couldn’t confirm delivery. Your note is still here; please try again later.' : ''}</p>
      {status === 'error' && <button type="button" className="t-meta link mt-3" onClick={() => formRef.current?.submit()}>Try direct delivery in a new tab</button>}
    </form>
  </div>;
}
