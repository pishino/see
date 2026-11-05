import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';

/*
 * When it's us, we say so (V3ProblemStates O1): owns the problem plainly, says the lists are safe, one retry. The small
 * line helps support without asking anything of them. Lists live in storage, not in the page, so nothing is lost.
 */
interface State {
  at: string | null;
}

export class OurSide extends Component<{ children: ReactNode; where?: string; resetKey?: string }, State> {
  state: State = { at: null };

  static getDerivedStateFromError(): State {
    const d = new Date();
    return { at: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // until there is a server to tell, the console is "we've been told"
    console.error('See: something broke on our side', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.at && prev.resetKey !== this.props.resetKey) this.setState({ at: null });
  }

  render() {
    if (!this.state.at) return this.props.children;
    return (
      <div className="ps-full" role="alert">
        <h1 className="t-hero" style={{ fontSize: 40 }}>
          Something broke on our side
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--see-text-2)', maxWidth: 520 }}>
          We couldn’t load {this.props.where ?? 'this'} just now. Your lists are safe and nothing was lost. Try again in a moment.
        </p>
        <Button onClick={() => this.setState({ at: null })}>Try again</Button>
        <span className="t-meta">Error · {this.state.at} · we’ve been told</span>
      </div>
    );
  }
}
