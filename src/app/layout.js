import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  metadataBase: new URL('https://nobofashion.com'),
  title: "Nobo Fashion — Women's Fashion & Three-Piece in Bangladesh",
  description:
    'Shop Nobo Fashion for premium three-piece, gowns, sarees and unstitched dresses. 100% authentic, cash on delivery, fast nationwide delivery across Bangladesh.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: "Nobo Fashion — Women's Fashion & Three-Piece in Bangladesh",
    description:
      'Shop Nobo Fashion for premium three-piece, gowns, sarees and unstitched dresses. 100% authentic, cash on delivery, fast nationwide delivery across Bangladesh.',
    url: 'https://nobofashion.com',
    siteName: 'Nobo Fashion',
    images: [
      {
        url: '/logo.jpg',
        width: 592,
        height: 592,
        alt: 'Nobo Fashion',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,400;1,600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.min.css"
        />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
