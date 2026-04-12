/**
 * TransakWidget Component
 * 
 * Opens Transak's hosted payment widget for card payments.
 * Flow: Card payment → XRP delivered to platform → Swapped to RLUSD → Sent to merchant
 * 
 * @see https://docs.transak.com/docs/integration-options
 */

'use client';

import { useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface TransakWidgetProps {
  /** Amount in USD to charge */
  amount: number;
  /** NETTEN payment/paylink ID for tracking */
  paymentId: string;
  /** Customer email (optional, pre-fills Transak form) */
  customerEmail?: string;
  /** Merchant's business name (shown in Transak UI) */
  merchantName?: string;
  /** Called when payment completes successfully */
  onSuccess?: (data: TransakSuccessData) => void;
  /** Called when payment fails */
  onFailure?: (error: TransakError) => void;
  /** Called when widget is closed */
  onClose?: () => void;
}

interface TransakSuccessData {
  orderId: string;
  status: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  fiatAmount: number;
  fiatCurrency: string;
  transactionHash?: string;
}

interface TransakError {
  message: string;
  code?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const TRANSAK_API_KEY = process.env.NEXT_PUBLIC_TRANSAK_API_KEY || '';
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || 'rDQzhMQbsNn6yefNMTj34rMHnHokYV6otH';
const TRANSAK_ENV = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'STAGING';

// =============================================================================
// COMPONENT
// =============================================================================

export function TransakWidget({
  amount,
  paymentId,
  customerEmail,
  merchantName = 'NETTEN',
  onSuccess,
  onFailure,
  onClose,
}: TransakWidgetProps) {
  
  const openTransak = useCallback(() => {
    // Dynamically load Transak SDK
    const script = document.createElement('script');
    script.src = 'https://global.transak.com/sdk/v1.4/widget.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore - Transak SDK creates global
      const transak = new window.Transak({
        apiKey: TRANSAK_API_KEY,
        environment: TRANSAK_ENV,
        
        // Payment configuration
        defaultCryptoCurrency: 'XRP',
        cryptoCurrencyList: 'XRP',
        network: 'mainnet',
        
        // Wallet configuration
        walletAddress: PLATFORM_WALLET,
        disableWalletAddressForm: true,
        
        // Amount configuration
        fiatAmount: amount,
        fiatCurrency: 'USD',
        
        // Customer info
        email: customerEmail || '',
        
        // Tracking
        partnerOrderId: paymentId,
        partnerCustomerId: paymentId,
        
        // UI configuration
        themeColor: '10B981', // NETTEN green
        hideMenu: true,
        hideExchangeScreen: false,
        
        // Widget behavior
        widgetWidth: '450px',
        widgetHeight: '650px',
        
        // Redirect after completion (optional)
        redirectURL: `${window.location.origin}/pay/success?paymentId=${paymentId}`,
      });
      
      // Open the widget
      transak.init();
      
      // Event handlers
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        onClose?.();
      });
      
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
        onSuccess?.({
          orderId: orderData.status.id,
          status: orderData.status.status,
          cryptoAmount: orderData.status.cryptoAmount,
          cryptoCurrency: orderData.status.cryptoCurrency,
          fiatAmount: orderData.status.fiatAmount,
          fiatCurrency: orderData.status.fiatCurrency,
          transactionHash: orderData.status.transactionHash,
        });
      });
      
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_ORDER_FAILED, (error: any) => {
        onFailure?.({
          message: error.message || 'Payment failed',
          code: error.code,
        });
      });
    };
    
    script.onerror = () => {
      onFailure?.({
        message: 'Failed to load payment widget',
        code: 'SCRIPT_LOAD_ERROR',
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, [amount, paymentId, customerEmail, onSuccess, onFailure, onClose]);
  
  return null; // This component just provides the openTransak function
}

// =============================================================================
// HOOK FOR EASIER USAGE
// =============================================================================

export function useTransak() {
  const openPayment = useCallback((options: {
    amount: number;
    paymentId: string;
    customerEmail?: string;
    onSuccess?: (data: TransakSuccessData) => void;
    onFailure?: (error: TransakError) => void;
    onClose?: () => void;
  }) => {
    const script = document.createElement('script');
    script.src = 'https://global.transak.com/sdk/v1.4/widget.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore
      const transak = new window.Transak({
        apiKey: TRANSAK_API_KEY,
        environment: TRANSAK_ENV,
        defaultCryptoCurrency: 'XRP',
        cryptoCurrencyList: 'XRP',
        network: 'mainnet',
        walletAddress: PLATFORM_WALLET,
        disableWalletAddressForm: true,
        fiatAmount: options.amount,
        fiatCurrency: 'USD',
        email: options.customerEmail || '',
        partnerOrderId: options.paymentId,
        partnerCustomerId: options.paymentId,
        themeColor: '10B981',
        hideMenu: true,
        widgetWidth: '450px',
        widgetHeight: '650px',
      });
      
      transak.init();
      
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        options.onClose?.();
      });
      
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
        options.onSuccess?.({
          orderId: orderData.status.id,
          status: orderData.status.status,
          cryptoAmount: orderData.status.cryptoAmount,
          cryptoCurrency: orderData.status.cryptoCurrency,
          fiatAmount: orderData.status.fiatAmount,
          fiatCurrency: orderData.status.fiatCurrency,
          transactionHash: orderData.status.transactionHash,
        });
      });
      
      // @ts-ignore
      window.Transak.on(window.Transak.EVENTS.TRANSAK_ORDER_FAILED, (error: any) => {
        options.onFailure?.({
          message: error.message || 'Payment failed',
          code: error.code,
        });
      });
    };
    
    document.body.appendChild(script);
  }, []);
  
  return { openPayment };
}

// =============================================================================
// PAY WITH CARD BUTTON COMPONENT
// =============================================================================

interface PayWithCardButtonProps {
  amount: number;
  paymentId: string;
  customerEmail?: string;
  onSuccess?: (data: TransakSuccessData) => void;
  onFailure?: (error: TransakError) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PayWithCardButton({
  amount,
  paymentId,
  customerEmail,
  onSuccess,
  onFailure,
  className = '',
  children,
}: PayWithCardButtonProps) {
  const { openPayment } = useTransak();
  
  const handleClick = () => {
    openPayment({
      amount,
      paymentId,
      customerEmail,
      onSuccess,
      onFailure,
    });
  };
  
  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
    >
      {children || (
        <>
          <CreditCardIcon className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Pay with card</span>
          <span className="text-sm text-gray-500">${amount.toFixed(2)}</span>
        </>
      )}
    </button>
  );
}

// Simple credit card icon
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

export default TransakWidget;
