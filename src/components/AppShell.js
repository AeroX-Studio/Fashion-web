'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/store/Header';
import { Footer } from '@/components/store/Footer';
import { MobileNav } from '@/components/store/MobileNav';
import { CartDrawer } from '@/components/store/CartDrawer';
import { WishlistDrawer } from '@/components/store/WishlistDrawer';
import { QuickViewModal } from '@/components/store/QuickViewModal';
import { SizeChartModal } from '@/components/store/SizeChartModal';
import { WhatsAppButton } from '@/components/store/WhatsAppButton';
import { LiveChatWidget } from '@/components/store/LiveChatWidget';

export function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname === '/login') return children;

  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <MobileNav />
      <CartDrawer />
      <WishlistDrawer />
      <QuickViewModal />
      <SizeChartModal />
      <WhatsAppButton />
      <LiveChatWidget />
    </>
  );
}
