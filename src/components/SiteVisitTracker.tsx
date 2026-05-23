import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SiteVisitTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const payload = JSON.stringify({
      path: `${location.pathname}${location.search}`,
      title: document.title,
      referrer: document.referrer || null,
    });

    fetch('/api/visits', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }, [location.pathname, location.search]);

  return null;
};

export default SiteVisitTracker;
