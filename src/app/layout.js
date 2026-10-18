import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { MobileNav } from '@/components/store/MobileNav';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WishlistDrawer } from '@/components/store/WishlistDrawer';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { SizeChartModal } from '@/components/store/SizeChartModal';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { LiveChatWidget } from '@/components/store/LiveChatWidget';

export const metadata = {
  title: "Nobo Fashion — Women's Fashion & Three-Piece in Bangladesh",
  description:
    'Shop Nobo Fashion for premium three-piece, gowns, sarees and unstitched dresses. 100% authentic, cash on delivery, fast nationwide delivery across Bangladesh.',
  icons: {
    icon: '/logo.jpg',
    shortcut: '/logo.jpg',
    apple: '/logo.jpg',
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
        width: 800,
        height: 600,
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
          {/* Top Bar */}
          <div className="pc-topbar">
            <div className="container pc-topbar-inner">
              <div className="pc-topbar-left">
                <div className="pc-topbar-promo">
                  <span>COD Available</span> Cash on delivery nationwide across Bangladesh
                </div>
              </div>
              <div className="pc-topbar-right">
                <a href="tel:09638044440">
                  <i className="ri-phone-line"></i> 09638-044440
                </a>
                <span>|</span>
                <a href="https://wa.me/8801800033223" target="_blank" rel="noopener noreferrer">
                  <i className="ri-whatsapp-line"></i> WhatsApp
                </a>
                <span>|</span>
                <span className="text-muted">Shop # 6, Uttara Square, Dhaka</span>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <Header />

          {/* Page Content */}
          <main style={{ flex: 1 }}>{children}</main>

          {/* Footer */}
          <Footer />

          {/* Mobile Bottom Navigation */}
          <MobileNav />

          {/* Drawers & Modals */}
          <CartDrawer />
          <WishlistDrawer />
          <QuickViewModal />
          <SizeChartModal />

          {/* Floating Action Buttons */}
          <WhatsAppButton />
          <LiveChatWidget />
        </Providers>
      </body>
    </html>
  );
}
