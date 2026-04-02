import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  defaultHomeContent,
  HomePageContent,
  normalizeHomeContent,
} from '@/lib/home-content';

const HomeContentContext = createContext<HomePageContent>(defaultHomeContent);

export const HomeContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<HomePageContent>(defaultHomeContent);

  useEffect(() => {
    let isMounted = true;

    api
      .get<unknown>('/api/site-content/home')
      .then((payload) => {
        if (isMounted) {
          setContent(normalizeHomeContent(payload));
        }
      })
      .catch(() => {
        if (isMounted) {
          setContent(defaultHomeContent);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <HomeContentContext.Provider value={content}>{children}</HomeContentContext.Provider>;
};

export const useHomeContent = () => useContext(HomeContentContext);
