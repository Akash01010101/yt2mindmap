'use client';

import { useEffect, useCallback } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

declare global {
  interface Window {
    turnstile: {
      render: (selector: string, config: {
        sitekey: string | undefined,
        callback: (token: string) => void
      }) => void;
      remove: (selector: string) => void;
    };
    onLoadTurnstileCallback?: () => void;
  }
}

export default function Turnstile({ onVerify }: TurnstileProps) {

  const onLoad = useCallback(() => {
    if (!window.turnstile) {
      console.error('Turnstile is not loaded');
      return;
    }

    window.turnstile.render('#turnstile-container', {
      sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY,
      callback: (token: string) => {
        sessionStorage.setItem('turnstile_verified', token);
        onVerify(token);
      },
    });
  }, [onVerify]);

  useEffect(() => {
    // Clean up any existing turnstile instances
    if (window.turnstile) {
      window.turnstile.remove('#turnstile-container');
    }
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="turnstile"]');
    let script: HTMLScriptElement | null = null;
    if (!existingScript) {
      // If not loaded, set up the callback and load the script
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onLoadTurnstileCallback';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    window.onLoadTurnstileCallback = onLoad;
    if (existingScript && window.turnstile) {
      // If script exists and turnstile is initialized, render immediately
      onLoad();
    }
    return () => {
      if (window.turnstile) {
        window.turnstile.remove('#turnstile-container');
      }
      if (script && !document.querySelector('#turnstile-container')) {
        script.remove();
      }
      // Only remove the callback if this is the last instance
      if (!document.querySelector('#turnstile-container')) {
        delete window.onLoadTurnstileCallback;
      }
    };
  }, [onLoad]);

  return <div id="turnstile-container" className="flex justify-center my-4" />;
}