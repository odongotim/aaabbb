import React from 'react';

/** Renders the official three solid-colour bands. Never use gradients here. */
export default function ColorStripe() {
  return (
    <div className="stripe" role="presentation" aria-hidden="true">
      <span className="stripe__band stripe__band--outer" />
      <span className="stripe__band stripe__band--middle" />
      <span className="stripe__band stripe__band--inner" />
    </div>
  );
}
