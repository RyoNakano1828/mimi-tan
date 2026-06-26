import Link from "next/link";

interface AuthShellProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthShell({ children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow--left" aria-hidden />
      <div className="auth-glow auth-glow--right" aria-hidden />

      <div className="auth-container">
        <header className="auth-brand">
          <Link href="/" className="auth-logo">
            みみたん
          </Link>
          <p className="auth-tagline">耳で覚える、TOEIC英語</p>
        </header>

        <div className="auth-card">{children}</div>

        {footer && <footer className="auth-footer">{footer}</footer>}
      </div>
    </div>
  );
}
