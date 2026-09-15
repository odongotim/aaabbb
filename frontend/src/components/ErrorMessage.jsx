import React from 'react';

/**
 * Renders a professional, text-based status/error message. Never pass raw
 * exception text or backend internals here — only user-safe copy.
 */
export default function ErrorMessage({ title, children, tone = 'error' }) {
  return (
    <div className={`status-panel status-panel--${tone}`} role="alert">
      {title && <p className="status-panel__title">{title}</p>}
      {children && <p className="status-panel__body">{children}</p>}
    </div>
  );
}
