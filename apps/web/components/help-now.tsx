'use client';

import { useEffect, useRef } from 'react';
import { CircleHelp, X } from 'lucide-react';

export function HelpNow() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const restore = () => triggerRef.current?.focus();
    dialog?.addEventListener('close', restore);
    return () => dialog?.removeEventListener('close', restore);
  }, []);

  return (
    <>
      <button ref={triggerRef} className="help-trigger" type="button" onClick={() => dialogRef.current?.showModal()}><CircleHelp aria-hidden="true" />Get help now</button>
      <dialog ref={dialogRef} className="help-dialog" aria-labelledby="help-title">
        <form method="dialog" className="help-dialog-inner">
          <button className="dialog-close" value="close" aria-label="Close help information"><X aria-hidden="true" /><span className="sr-only">Close</span></button>
          <p className="safety-label">Immediate support</p>
          <h2 id="help-title">If someone may be in danger, call now.</h2>
          <p>SizoCare cannot determine whether someone is safe. You do not need to wait for the app or an AI response.</p>
          <div className="help-actions">
            <a href="tel:112"><span>Emergency services</span><strong>112</strong></a>
            <a href="tel:14416"><span>Tele-MANAS mental health support</span><strong>14416</strong></a>
            <a href="tel:18005990019"><span>KIRAN mental health helpline</span><strong>1800-599-0019</strong></a>
          </div>
          <p className="international-note">Outside India, call your local emergency number or use <a href="https://findahelpline.com" target="_blank" rel="noreferrer">Find a Helpline</a>.</p>
        </form>
      </dialog>
    </>
  );
}
