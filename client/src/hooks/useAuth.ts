import { useState, useEffect } from 'react';
import { User } from '@shared/schema';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('cbt_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('cbt_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Pass through email verification flag
      const errorWithFlag = new Error(error.message || 'Login failed');
      (errorWithFlag as any).needsEmailVerification = error.needsEmailVerification;
      throw errorWithFlag;
    }

    const userData = await response.json();
    setUser(userData);
    localStorage.setItem('cbt_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    nickname: string;
    password: string;
  }): Promise<any> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || 'Registration failed' };
      }
      throw new Error(error.message || 'Registration failed');
    }

    const registrationResult = await response.json();
    // Don't auto-login after registration - user needs to verify email first
    return registrationResult;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cbt_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('cbt_user', JSON.stringify(updatedUser));
    }
  };

  const handleGoogleAuth = async (userData: any): Promise<User> => {
    setUser(userData);
    localStorage.setItem('cbt_user', JSON.stringify(userData));
    return userData;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    handleGoogleAuth,
  };
}
