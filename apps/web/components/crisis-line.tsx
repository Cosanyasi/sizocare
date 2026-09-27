import { copy } from '@/lib/copy';

export function CrisisLine() {
  return (
    <footer className="crisis-line">
      <span>{copy.crisis.warning}</span>
      <span className="crisis-contacts">
        <a href={`tel:${copy.crisis.emergencyNumber}`}>
          {copy.crisis.emergencyLabel}: <strong>{copy.crisis.emergencyNumber}</strong>
        </a>
        <span aria-hidden="true">&middot;</span>
        <a href={`tel:${copy.crisis.helplineNumber}`}>
          {copy.crisis.helplineLabel}: <strong>{copy.crisis.helplineNumber}</strong>
        </a>
      </span>
    </footer>
  );
}
