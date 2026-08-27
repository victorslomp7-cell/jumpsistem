"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getExistingPushSubscription, subscribeToPush, unsubscribeFromPush } from "@/lib/push/subscribe-client";

export function NotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported] = useState(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );

  useEffect(() => {
    if (!supported) return;
    getExistingPushSubscription().then((sub) => setSubscribed(!!sub));
  }, [supported]);

  async function toggle() {
    setLoading(true);
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
    } else {
      const result = await subscribeToPush();
      if (result.ok) {
        setSubscribed(true);
      } else {
        alert(result.error);
      }
    }
    setLoading(false);
  }

  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      title={subscribed ? "Desativar notificações" : "Ativar notificações"}
    >
      {subscribed ? <Bell className="size-4" /> : <BellOff className="size-4" />}
    </Button>
  );
}
