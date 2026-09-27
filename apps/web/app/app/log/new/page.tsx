import { LogForm } from './log-form';

export default function NewLogPage() {
  return <div className="page-stack narrow-page"><header className="page-heading"><p>Daily log</p><h1>What did you notice?</h1><span>A quick factual note is enough. Every field except the category and time is optional.</span></header><LogForm /></div>;
}
