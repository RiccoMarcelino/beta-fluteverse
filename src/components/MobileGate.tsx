import type { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  children: ReactNode;
}

export function MobileGate({ children }: Props) {
  const isMobile = useIsMobile();
  if (isMobile) return null;
  return <>{children}</>;
}
