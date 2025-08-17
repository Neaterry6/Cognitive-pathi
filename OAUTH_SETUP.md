# OAuth Setup Guide

## Currently Disabled
OAuth providers (Google Sign-In) have been disabled to simplify authentication. The app now uses only normal email/password signup and login.

## How to Re-enable Google OAuth Later

### 1. Frontend Changes Required

**In `client/src/pages/Login.tsx`:**
```javascript
// 1. Add the import back (line 10):
import GoogleAuthButton from '@/components/GoogleAuthButton';

// 2. Add the divider and button back after the login form (around line 216):
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-purple-200">Or continue with</span>
              </div>
            </div>

            {/* Google Auth Button */}
            <GoogleAuthButton
              onSuccess={onLogin}
              onError={(error) => {
                toast({
                  title: "Google Sign-In Failed",
                  description: error,
                  variant: "destructive",
                });
              }}
              isLoading={isLoading}
              disabled={isLoading}
            />
```

### 2. Backend Changes Required

**In `server/routes.ts`:**
```javascript
// 1. Uncomment the import (line 10):
import { googleAuthService } from "./services/googleAuthService";

// 2. Uncomment the entire Google OAuth route (around line 1953):
// Remove the /* and */ comment blocks around the Google auth route
```

### 3. Environment Variables Required

Add these environment variables to enable Google OAuth:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Frontend Google Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add redirect URIs for your app

### 5. Additional OAuth Providers

The current setup only includes Google OAuth, but you can add others like:

- **Facebook**: Add Facebook SDK and create similar service
- **GitHub**: Use GitHub OAuth API
- **Twitter**: Use Twitter OAuth 2.0
- **Microsoft**: Use Microsoft Graph API

### File Locations
- Google Auth Service: `server/services/googleAuthService.ts`
- Google Auth Component: `client/src/components/GoogleAuthButton.tsx`
- Auth Hook: `client/src/hooks/useAuth.ts` (has Google auth handler)

### Current Authentication Flow
1. **Registration**: Email, password, name, nickname → Email verification required
2. **Login**: Email and password → Must verify email first
3. **Activation**: Premium features via WhatsApp unlock codes

### Notes
- All Google OAuth files are still present, just disabled
- The GoogleAuthButton component still exists and works
- Database schema supports Google ID and avatar fields
- Email verification is bypassed for Google users when OAuth is enabled