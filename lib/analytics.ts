import posthog from "posthog-js";
import { env } from "@/lib/env";

// Initialize PostHog in client-side code
export function initAnalytics() {
  if (env.NEXT_PUBLIC_POSTHOG_KEY && env.NEXT_PUBLIC_POSTHOG_HOST) {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false,
      persistence: "localStorage",
      autocapture: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }
}

// Track custom events
export const trackEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  posthog.capture(eventName, properties);
};

// Track page views
export const trackPageView = (url: string) => {
  posthog.capture("$pageview", { url });
};

// Identify users
export const identifyUser = (
  userId: string,
  properties?: Record<string, any>,
) => {
  posthog.identify(userId, properties);
};

// Reset user identification
export const resetUser = () => {
  posthog.reset();
};

// Track feature usage
export const trackFeatureUsage = (
  featureName: string,
  properties?: Record<string, any>,
) => {
  posthog.capture("feature_used", {
    feature: featureName,
    ...properties,
  });
};

// Track errors
export const trackError = (error: Error, context?: Record<string, any>) => {
  posthog.capture("error", {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
};
