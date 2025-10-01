
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Simulate API call - replace with actual authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      // For demo purposes, use hardcoded users
      const demoUsers = {
        'admin': { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
        'user': { username: 'user', password: 'user123', role: 'readonly', name: 'Read Only User' },
        'manager': { username: 'manager', password: 'manager123', role: 'admin', name: 'Release Manager' }
      };

      const demoUser = demoUsers[username];
      if (demoUser && demoUser.password === password) {
        const userData = {
          username: demoUser.username,
          role: demoUser.role,
          name: demoUser.name
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } else {
        throw new Error('Invalid username or password');
      }
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isReadOnly = () => {
    return user && user.role === 'readonly';
  };

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isReadOnly,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
