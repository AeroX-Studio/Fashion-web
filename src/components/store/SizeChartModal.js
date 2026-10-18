'use client';

import React from 'react';
import { useUI } from '@/context/UIContext';

export function SizeChartModal() {
  const { isSizeChartOpen, closeSizeChart, sizeChartCategory } = useUI();

  if (!isSizeChartOpen) return null;

  const sizeData = [
    { size: 'S', numeric: '36', bust: '34"–35"', waist: '28"–29"', hip: '36"–37"', length: '38"' },
    { size: 'M', numeric: '38', bust: '36"–37"', waist: '30"–31"', hip: '38"–39"', length: '39"' },
    { size: 'L', numeric: '40', bust: '38"–39"', waist: '32"–33"', hip: '40"–41"', length: '40"' },
    { size: 'XL', numeric: '42', bust: '40"–41"', waist: '34"–35"', hip: '42"–43"', length: '41"' },
    { size: 'XXL', numeric: '44', bust: '42"–43"', waist: '36"–37"', hip: '44"–45"', length: '42"' },
    { size: '3XL', numeric: '46', bust: '44"–45"', waist: '38"–39"', hip: '46"–47"', length: '42"' },
    { size: '4XL', numeric: '48', bust: '46"–47"', waist: '40"–41"', hip: '48"–49"', length: '42"' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={closeSizeChart}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          maxWidth: '640px',
          width: '100%',
          padding: '28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeSizeChart}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--paper-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
          }}
        >
          <i className="ri-close-line"></i>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <i className="ri-ruler-line" style={{ fontSize: '24px', color: 'var(--primary)' }}></i>
          <div>
            <h3 style={{ fontSize: '20px', color: 'var(--navy)' }}>Size Measurement Guide</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {sizeChartCategory ? `For ${sizeChartCategory}` : 'Nobo Fashion Women Standard Measurements'}
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Standard</th>
                <th>Numeric</th>
                <th>Bust</th>
                <th>Waist</th>
                <th>Hip</th>
                <th>Kameez Length</th>
              </tr>
            </thead>
            <tbody>
              {sizeData.map((row) => (
                <tr key={row.size}>
                  <td><strong>{row.size}</strong></td>
                  <td>{row.numeric}</td>
                  <td>{row.bust}</td>
                  <td>{row.waist}</td>
                  <td>{row.hip}</td>
                  <td>{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: 'var(--paper-2)',
            padding: '14px 18px',
            borderRadius: '8px',
            fontSize: '12.5px',
            color: 'var(--text-body)',
            lineHeight: 1.5,
          }}
        >
          <strong>💡 Measurement Tips:</strong>
          <ul style={{ paddingLeft: '18px', marginTop: '6px' }}>
            <li>Bust: Measure around the fullest part of your bust while keeping the tape parallel to the floor.</li>
            <li>If you are between two sizes, we recommend choosing the larger size for a comfortable fit.</li>
            <li>Exchange is available if size does not fit after delivery.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
