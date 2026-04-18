type EventName =
  | 'form_start'
  | 'step_complete'
  | 'package_selected'
  | 'coupon_applied'
  | 'order_submitted'
  | 'payment_completed'
  | 'message_sent'
  | 'review_submitted'
  | 'referral_shared'
  | 'chat_opened'
  | 'chat_message';

interface EventData {
  [key: string]: string | number | boolean | undefined;
}

// In dev: console log. In prod: send to analytics provider
export function trackEvent(name: EventName, data?: EventData) {
  const event = { name, data, timestamp: new Date().toISOString() };

  // Always log in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event);
  }

  // PostHog / Mixpanel integration point
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(name, data);
  }
}

// Server-side tracking (for API routes)
export function trackServerEvent(name: EventName, data?: EventData) {
  console.log('[Server Analytics]', { name, data, timestamp: new Date().toISOString() });
  // In production: send to analytics API
}
