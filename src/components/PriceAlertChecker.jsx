import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTradePrices } from '../api/prices';
import useStore from '../store/useStore';

export default function PriceAlertChecker() {
  const { priceAlerts, markAlertTriggered } = useStore();
  const permissionAsked = useRef(false);

  // Piggybacks on the shared cache — no extra network call
  const { data: tokens } = useQuery({
    queryKey: ['trade-prices'],
    queryFn: fetchTradePrices,
    staleTime: 10000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!permissionAsked.current && 'Notification' in window && Notification.permission === 'default') {
      permissionAsked.current = true;
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!tokens?.length) return;
    const activeAlerts = priceAlerts.filter(a => !a.triggered);
    if (!activeAlerts.length) return;

    const priceMap = {};
    tokens.forEach(t => { priceMap[t.symbol.toUpperCase()] = t.current_price; });

    activeAlerts.forEach(alert => {
      const current = priceMap[alert.symbol];
      if (current == null) return;

      const hit =
        (alert.condition === 'above' && current >= alert.targetPrice) ||
        (alert.condition === 'below' && current <= alert.targetPrice);

      if (!hit) return;
      markAlertTriggered(alert.id);

      const body = `${alert.symbol} is $${current.toLocaleString('en-US', { maximumFractionDigits: 4 })} — target: ${alert.condition} $${alert.targetPrice.toLocaleString()}`;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 Price Alert — ${alert.symbol}`, { body, icon: '/favicon.ico' });
      }
    });
  }, [tokens, priceAlerts]);

  return null;
}
