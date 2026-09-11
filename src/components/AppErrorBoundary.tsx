import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RotateCcw, ShieldCheck } from "lucide-react";
import { Brand } from "./Brand";
import { Button } from "./Button";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  failed: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, information: ErrorInfo): void {
    console.error("Veya interface error", error, information.componentStack);
  }

  private reload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-error">
        <Brand />
        <div className="feature-icon"><AlertCircle size={27} /></div>
        <p className="eyebrow">something paused</p>
        <h1>Veya couldn’t finish opening.</h1>
        <p>Reload the app to try again. Your camera and local data have not been uploaded.</p>
        <Button onClick={this.reload}><RotateCcw size={16} /> Reload Veya</Button>
        <small><ShieldCheck size={14} /> Processing stays on this device</small>
      </main>
    );
  }
}
