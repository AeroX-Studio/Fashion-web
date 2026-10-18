'use client';

import React from 'react';

export function WhatsAppButton() {
  const phoneNumber = '8801800033223';
  const defaultMessage = 'Hello Nobo Fashion! I am interested in placing an order.';

  const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-float"
      title="Chat with us on WhatsApp"
      aria-label="Chat on WhatsApp"
    >
      <i className="ri-whatsapp-line"></i>
    </a>
  );
}
