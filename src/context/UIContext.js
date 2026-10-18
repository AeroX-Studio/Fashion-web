'use client';

import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Size Chart Modal
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [sizeChartCategory, setSizeChartCategory] = useState(null);

  const openQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const openSizeChart = (categoryName = null) => {
    setSizeChartCategory(categoryName);
    setIsSizeChartOpen(true);
  };

  const closeSizeChart = () => {
    setIsSizeChartOpen(false);
  };

  return (
    <UIContext.Provider
      value={{
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        isChatOpen,
        setIsChatOpen,
        isMobileNavOpen,
        setIsMobileNavOpen,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        isSizeChartOpen,
        sizeChartCategory,
        openSizeChart,
        closeSizeChart,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
