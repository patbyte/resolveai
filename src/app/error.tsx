"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fatal-state">
      <p className="eyebrow">Workspace interrupted</p>
      <h1>We couldn&apos;t load this view.</h1>
      <p>Your data is safe. Retry the request or return in a moment.</p>
      <button className="primary-button" onClick={reset}>Retry</button>
    </main>
  );
}
