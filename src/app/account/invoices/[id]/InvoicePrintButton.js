'use client';

import React from 'react';

export function InvoicePrintButton() {
  return (
    <button
      type="button"
      className="btn btn-primary btn-sm"
      onClick={() => window.print()}
    >
      <i className="ri-printer-line"></i> Print / Save as PDF
    </button>
  );
}
