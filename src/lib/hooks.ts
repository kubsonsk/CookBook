import React, { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useLongPress(
  onLongPress: (e: any) => void,
  onClick?: () => void,
  { delay = 500, shouldPreventDefault = true } = {}
) {
  const timeout = React.useRef<NodeJS.Timeout>(null);
  const target = React.useRef<any>(null);
  const startPos = React.useRef<{ x: number; y: number } | null>(null);
  const isMoved = React.useRef(false);
  const longPressTriggered = React.useRef(false);

  const start = React.useCallback(
    (event: any) => {
      const touch = event.touches ? event.touches[0] : event;
      startPos.current = { x: touch.clientX, y: touch.clientY };
      isMoved.current = false;
      longPressTriggered.current = false;

      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false
        });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        onLongPress(event);
        longPressTriggered.current = true;
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const move = React.useCallback((event: any) => {
    if (!startPos.current || isMoved.current) return;
    const touch = event.touches ? event.touches[0] : event;
    const dx = Math.abs(touch.clientX - startPos.current.x);
    const dy = Math.abs(touch.clientY - startPos.current.y);
    
    // If moved more than 10px, cancel long press and click
    if (dx > 10 || dy > 10) {
      isMoved.current = true;
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    }
  }, []);

  const clear = React.useCallback(
    (event: any, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      if (shouldTriggerClick && !longPressTriggered.current && !isMoved.current && onClick) {
        onClick();
      }
      
      // We use a small timeout to remove the listener to ensure it has a chance to run 
      // for the current touchend event if it's the one that triggered this clear.
      if (shouldPreventDefault && target.current) {
        const currentTarget = target.current;
        setTimeout(() => {
          currentTarget.removeEventListener('touchend', preventDefault);
        }, 10);
      }
      startPos.current = null;
    },
    [onClick, shouldPreventDefault]
  );

  return {
    onMouseDown: (e: any) => start(e),
    onMouseUp: (e: any) => clear(e),
    onMouseLeave: (e: any) => clear(e, false),
    onTouchStart: (e: any) => start(e),
    onTouchMove: (e: any) => move(e),
    onTouchEnd: (e: any) => clear(e),
    onContextMenu: (e: any) => {
      if (shouldPreventDefault) e.preventDefault();
    }
  };
}

function preventDefault(e: any) {
  if (!e.cancelable) return;
  e.preventDefault();
}
