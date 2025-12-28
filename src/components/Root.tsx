import { TonConnectUIProvider } from '@tonconnect/ui-react';
import '../buffer-polyfill';
import { useEffect } from 'react';

import { App } from '@/components/App.tsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { ThirdwebProvider } from "thirdweb/react";
import { WalletProvider } from '@/contexts/WalletContext';
import { initializeServiceWorker } from '@/utils/serviceWorker';



function ErrorBoundaryError({ error }: { error: unknown }) {
  if (error instanceof Error && error.message === 'USER_CANCELED') {
    return null;
  }

  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

export function Root() {
  // Initialize service worker on app start
  useEffect(() => {
    // Don't block app loading for service worker
    initializeServiceWorker().then((registered) => {
      if (registered) {
        console.log('✅ Service Worker initialized - Offline functionality enabled');
      } else {
        console.log('❌ Service Worker not supported or failed to register');
      }
    }).catch((error) => {
      console.log('❌ Service Worker initialization failed:', error);
    });
  }, []);

  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <ThirdwebProvider>
        <TonConnectUIProvider
          manifestUrl={publicUrl('https://cdn4.stakenova.io/tonconnect-manifest.json')}
        >
          <WalletProvider>
            <App/>
          </WalletProvider>
        </TonConnectUIProvider>
      </ThirdwebProvider>
    </ErrorBoundary>
  );
}
