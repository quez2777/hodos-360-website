/**
 * Stripe Integration for HODOS 360
 * 
 * This module provides Stripe client configuration and utilities
 * for payment processing and subscription management.
 */

import Stripe from 'stripe';

// Function to get Stripe instance - only throws at runtime when actually needed
function createStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is required but not found in environment variables. Please configure your Stripe secret key.');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
  });
}

// Lazy initialization - only creates instance when first accessed
let stripeInstance: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(target, prop) {
    if (!stripeInstance) {
      stripeInstance = createStripeInstance();
    }
    return stripeInstance[prop as keyof Stripe];
  }
});

// Stripe configuration with runtime validation
export const stripeConfig = {
  get publicKey() {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key && typeof window !== 'undefined') {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required but not found in environment variables.');
    }
    return key;
  },
  get webhookSecret() {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required but not found in environment variables. Please configure your Stripe webhook secret.');
    }
    return secret;
  },
  get successUrl() {
    return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/success';
  },
  get cancelUrl() {
    return (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/pricing';
  },
};

export * from './products';