import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FaGoogle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

interface GoogleAuthButtonProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: () => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

export default function GoogleAuthButton({ 
  onSuccess, 
  onError, 
  isLoading = false, 
  disabled = false 
}: GoogleAuthButtonProps) {

  const handleGoogleAuth = useCallback(async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credential
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google authentication failed');
      }

      const userData = await response.json();
      onSuccess(userData);
    } catch (error) {
      console.error('Google Auth error:', error);
      onError(error instanceof Error ? error.message : 'Authentication failed');
    }
  }, [onSuccess, onError]);

  const initializeGoogleAuth = useCallback(() => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            handleGoogleAuth(response.credential);
          }
        },
      });
    }
  }, [handleGoogleAuth]);

  const handleGoogleSignIn = useCallback(() => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.prompt();
    } else {
      // Fallback - load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleAuth();
        if (window.google) {
          window.google.accounts.id.prompt();
        }
      };
      document.head.appendChild(script);
    }
  }, [initializeGoogleAuth]);

  React.useEffect(() => {
    // Load Google Identity Services on component mount
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.head.appendChild(script);
    } else if (window.google) {
      initializeGoogleAuth();
    }
  }, [initializeGoogleAuth]);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled || isLoading}
      className="w-full bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <FaGoogle className="w-4 h-4 mr-2 text-red-500" />
      )}
      Continue with Google
    </Button>
  );
}