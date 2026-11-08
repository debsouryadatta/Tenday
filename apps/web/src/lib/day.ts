import { useEffect, useState } from 'react';
import { localDay } from '@tenday/domain';
export function useDay() {
  const [day, setDay] = useState(localDay());
  useEffect(() => {
    const update = () => setDay(localDay());
    const timer = setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return day;
}
