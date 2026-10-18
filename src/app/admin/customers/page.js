import React from 'react';
import { initDatabase, all } from '@/lib/db';

export const revalidate = 0;

export default async function AdminCustomersPage() {
  await initDatabase();

  const customers = all(`
    SELECT u.*, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.user_type = 'customer'
    GROUP BY u.id
    ORDER BY u.id DESC
  `);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', color: 'var(--navy)' }}>Customer Accounts</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Registered customer base, total Cash on Delivery spent, and order history
        </p>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <strong>Customers ({customers.length})</strong>
        </div>

        {customers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered customers yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th>Total Orders</th>
                  <th>Total Spent (COD)</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ color: 'var(--navy)' }}>{c.name}</strong>
                    </td>
                    <td>
                      <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {c.phone}
                      </a>
                    </td>
                    <td>{c.email || 'N/A'}</td>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {c.order_count || 0}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        ৳{(c.total_spent || 0).toLocaleString('en-BD')}
                      </span>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
