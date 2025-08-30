/**
 * Stripe Integration for HODOS 360
 * 
 * This module provides Stripe client configuration and utilities
 * for payment processing and subscription management.
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Stripe configuration
export const stripeConfig = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  successUrl: process.env.NEXTAUTH_URL + '/success',
  cancelUrl: process.env.NEXTAUTH_URL + '/pricing',
};

// Validate required environment variables
if (!stripeConfig.publicKey) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required');
}

if (!stripeConfig.webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required');
}

export * from './products';