'use client';

import { useEffect } from 'react';

export function DeploymentConfigInjector() {
  useEffect(() => {
    // Fetch deployment config from the API
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/deployment-config');
        if (response.ok) {
          const config = await response.json();
          (window as any).__DEPLOYMENT_CONFIG__ = config;
        }
      } catch (error) {
        console.warn('Failed to load deployment config:', error);
      }
    };

    fetchConfig();
  }, []);

  return null;
}
