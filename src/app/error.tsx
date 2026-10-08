"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="main" className="auth-page"><section className="auth-panel"><h1>The gallery couldn’t load.</h1><p>Check your connection, then try again.</p><button className="primary" onClick={reset}>Try again</button></section></main>;
}
