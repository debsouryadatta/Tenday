import { useEffect, useState } from 'react';
import { localDay } from '@tenday/domain';
export function useDay() {
  const [day, setDay] = useState(localDay());
  useEffect(() => {
    const timer = setInterval(() => setDay(localDay()), 30000);
    return () => clearInterval(timer);
  }, []);
  return day;
}
