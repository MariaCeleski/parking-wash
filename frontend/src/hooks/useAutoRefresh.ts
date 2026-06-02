import { useEffect } from 'react';

/**
 * Hook that automatically calls a callback function at regular intervals.
 * Calls the callback immediately on mount and then at the specified interval.
 * 
 * @param callback - Function to call at each interval
 * @param interval - Interval in milliseconds (default: 30000ms = 30 seconds)
 */
export function useAutoRefresh(
  callback: () => void | Promise<void>,
  interval: number = 30000
): void {
  useEffect(() => {
    // Call immediately on mount
    callback();

    // Set up interval for subsequent calls
    const intervalId = setInterval(() => {
      callback();
    }, interval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [callback, interval]);
}
