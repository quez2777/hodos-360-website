/**
 * Stripe Checkout Session Creation API
 * 
 * Creates Stripe checkout sessions for HODOS 360 products
 * Handles all pricing tiers, coupons, and UTM tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getTierById, coupons, type CouponCode } from '@/lib/stripe/products';
import { headers } from 'next/headers';
import Stripe from 'stripe';

interface CreateCheckoutRequest {
  productId: string;
  tierId: string;
  billingPeriod: 'monthly' | 'annual';
  couponCode?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  customerInfo?: {
    email?: string;
    name?: string;
    firmName?: string;
    phone?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCheckoutRequest = await request.json();
    const { productId, tierId, billingPeriod, couponCode, utmParams, customerInfo } = body;

    // Validate required fields
    if (!productId || !tierId || !billingPeriod) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, tierId, billingPeriod' },
        { status: 400 }
      );
    }

    // Get pricing tier information
    const tier = getTierById(productId, tierId);
    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid product or tier ID' },
        { status: 400 }
      );
    }

    // Validate billing period matches tier
    if (billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return NextResponse.json(
        { error: 'Invalid billing period. Must be "monthly" or "annual"' },
        { status: 400 }
      );
    }

    // Get the appropriate Stripe price ID
    const priceId = tier.stripePriceId;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this tier' },
        { status: 500 }
      );
    }

    // Validate coupon code if provided
    let couponId: string | undefined;
    if (couponCode) {
      const coupon = coupons[couponCode as CouponCode];
      if (!coupon) {
        return NextResponse.json(
          { error: 'Invalid coupon code' },
          { status: 400 }
        );
      }

      // Check if coupon is expired
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        return NextResponse.json(
          { error: 'Coupon code has expired' },
          { status: 400 }
        );
      }

      // Check if coupon applies to this product
      if (!coupon.applicableProducts.includes(productId)) {
        return NextResponse.json(
          { error: 'Coupon not applicable to this product' },
          { status: 400 }
        );
      }

      // Check if coupon requires specific billing period
      if ('billingPeriod' in coupon && coupon.billingPeriod && coupon.billingPeriod !== billingPeriod) {
        return NextResponse.json(
          { error: `Coupon only applies to ${coupon.billingPeriod} plans` },
          { status: 400 }
        );
      }

      couponId = couponCode;
    }

    // Get origin for redirect URLs
    const headersList = headers();
    const origin = headersList.get('origin') || process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Prepare checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}&product=${productId}&tier=${tierId}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      tax_id_collection: {
        enabled: true,
      },
      custom_fields: [
        {
          key: 'firm_name',
          label: {
            type: 'custom',
            custom: 'Law Firm Name',
          },
          type: 'text',
          optional: false,
        },
        {
          key: 'practice_areas',
          label: {
            type: 'custom',
            custom: 'Primary Practice Areas',
          },
          type: 'text',
          optional: true,
        },
      ],
      metadata: {
        productId,
        tierId,
        billingPeriod,
        ...(utmParams && {
          utm_source: utmParams.source || '',
          utm_medium: utmParams.medium || '',
          utm_campaign: utmParams.campaign || '',
          utm_term: utmParams.term || '',
          utm_content: utmParams.content || '',
        }),
      },
      subscription_data: {
        metadata: {
          productId,
          tierId,
          billingPeriod,
          ...(utmParams && {
            utm_source: utmParams.source || '',
            utm_medium: utmParams.medium || '',
            utm_campaign: utmParams.campaign || '',
            utm_term: utmParams.term || '',
            utm_content: utmParams.content || '',
          }),
        },
        trial_period_days: tier.trialDays,
      },
    };

    // Add coupon if provided
    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    // Add customer information if provided
    if (customerInfo?.email) {
      sessionParams.customer_email = customerInfo.email;
    }

    // Add setup fee if applicable
    if (tier.setupFee && tier.setupFee > 0) {
      // Create a one-time payment for setup fee
      sessionParams.line_items!.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tier.name} Setup Fee`,
            description: 'One-time setup and onboarding fee',
          },
          unit_amount: tier.setupFee * 100, // Convert to cents
        },
        quantity: 1,
      });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Store checkout session info for webhook processing
    // This would typically go into a database
    console.log('Checkout session created:', {
      sessionId: session.id,
      productId,
      tierId,
      billingPeriod,
      customerEmail: customerInfo?.email,
      utmParams,
    });

    // Return session data
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      tier: {
        name: tier.name,
        price: billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice,
        billingPeriod,
        trialDays: tier.trialDays,
        setupFee: tier.setupFee,
      },
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment processing error', 
          details: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving session information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
        subscription: session.subscription,
      },
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Session retrieval error', 
          details: error.message 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}