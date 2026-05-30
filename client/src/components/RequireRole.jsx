import React from 'react';
import useAuthStore from '../store/authStore';

export default function RequireRole({ allowed, children }) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowed.includes(user.role)) {
    return null; // Silently hide the UI if unauthorized
  }

  return children;
}
