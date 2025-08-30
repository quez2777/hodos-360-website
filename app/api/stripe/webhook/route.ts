/**
 * Stripe Webhook Handler
 * 
 * Processes Stripe webhook events for subscription management,
 * payment confirmations, and customer lifecycle events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe';
import { headers } from 'next/headers';
import Stripe from 'stripe';

// GoHighLevel integration (placeholder - implement based on your GHL setup)
interface GHLContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  source?: string;
  tags?: string[];
}

// Mock GHL functions - replace with actual implementation
async function createOrUpdateGHLContact(contact: GHLContact): Promise<void> {
  console.log('Creating/updating GHL contact:', contact);
  // TODO: Implement actual GHL API calls
}

async function updateGHLOpportunity(email: string, status: string, value?: number): Promise<void> {
  console.log('Updating GHL opportunity:', { email, status, value });
  // TODO: Implement actual GHL API calls
}

async function triggerGHLCampaign(email: string, campaignId: string): Promise<void> {
  console.log('Triggering GHL campaign:', { email, campaignId });
  // TODO: Implement actual GHL API calls
}

// Email service functions (placeholder - integrate with your email service)
async function sendWelcomeEmail(email: string, productName: string, tierName: string): Promise<void> {
  console.log('Sending welcome email:', { email, productName, tierName });
  // TODO: Implement actual email sending
}

async function sendPaymentFailedEmail(email: string): Promise<void> {
  console.log('Sending payment failed email:', email);
  // TODO: Implement actual email sending
}

async function sendCancellationEmail(email: string): Promise<void> {
  console.log('Sending cancellation email:', email);
  // TODO: Implement actual email sending
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', session.id);

  try {
    // Extract metadata
    const { productId, tierId, utm_source, utm_medium, utm_campaign } = session.metadata || {};
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    const firmName = session.custom_fields?.find(f => f.key === 'firm_name')?.text?.value;

    if (!customerEmail) {
      console.error('No customer email found in checkout session');
      return;
    }

    // Create or update contact in GHL
    const ghlContact: GHLContact = {
      email: customerEmail,
      firstName: customerName?.split(' ')[0],
      lastName: customerName?.split(' ').slice(1).join(' '),
      companyName: firmName || undefined,
      source: utm_source || 'website',
      tags: ['hodos-customer', `product-${productId}`, `tier-${tierId}`],
    };

    await createOrUpdateGHLContact(ghlContact);

    // Update opportunity status in GHL
    await updateGHLOpportunity(
      customerEmail,
      'checkout_completed',
      session.amount_total ? session.amount_total / 100 : undefined
    );

    // Send welcome email
    const productName = getProductDisplayName(productId);
    const tierName = getTierDisplayName(tierId);
    await sendWelcomeEmail(customerEmail, productName, tierName);

    // Trigger onboarding campaign in GHL
    const onboardingCampaignId = getOnboardingCampaignId(productId);
    if (onboardingCampaignId) {
      await triggerGHLCampaign(customerEmail, onboardingCampaignId);
    }

    console.log(`Successfully processed checkout completion for ${customerEmail}`);

  } catch (error) {
    console.error('Error processing checkout completion:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if ('email' in customer && customer.email) {
      await updateGHLOpportunity(customer.email, 'subscription_active');
      
      // Add subscription-specific tags
      const ghlContact: GHLContact = {
        email: customer.email,
        tags: ['active-subscription', `subscription-${subscription.id}`],
      };
      
      await createOrUpdateGHLContact(ghlContact);
    }

  } catch (error) {
    console.error('Error processing subscription creation:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if ('email' in customer && customer.email) {
      const status = subscription.status;
      await updateGHLOpportunity(customer.email, `subscription_${status}`);
      
      // Update tags based on subscription status
      let tags = [`subscription-${subscription.id}`, `status-${status}`];
      
      if (status === 'active') {
        tags.push('active-subscription');
      } else if (status === 'past_due') {
        tags.push('payment-issue');
      } else if (['canceled', 'unpaid'].includes(status)) {
        tags.push('inactive-subscription');
      }

      const ghlContact: GHLContact = {
        email: customer.email,
        tags,
      };
      
      await createOrUpdateGHLContact(ghlContact);
    }

  } catch (error) {
    console.error('Error processing subscription update:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if ('email' in customer && customer.email) {
      await updateGHLOpportunity(customer.email, 'subscription_canceled');
      await sendCancellationEmail(customer.email);
      
      // Update contact tags
      const ghlContact: GHLContact = {
        email: customer.email,
        tags: ['canceled-subscription', 'churned-customer'],
      };
      
      await createOrUpdateGHLContact(ghlContact);

      // Trigger win-back campaign
      const winBackCampaignId = 'win-back-campaign-id'; // Configure this
      await triggerGHLCampaign(customer.email, winBackCampaignId);
    }

  } catch (error) {
    console.error('Error processing subscription deletion:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  try {
    if (invoice.customer && (invoice as any).subscription) {
      const customer = await stripe.customers.retrieve(invoice.customer as string);
      
      if ('email' in customer && customer.email) {
        await updateGHLOpportunity(
          customer.email,
          'payment_succeeded',
          invoice.amount_paid / 100
        );

        // Update payment history tags
        const ghlContact: GHLContact = {
          email: customer.email,
          tags: ['payment-current', 'good-standing'],
        };
        
        await createOrUpdateGHLContact(ghlContact);
      }
    }

  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  try {
    if (invoice.customer) {
      const customer = await stripe.customers.retrieve(invoice.customer as string);
      
      if ('email' in customer && customer.email) {
        await updateGHLOpportunity(customer.email, 'payment_failed');
        await sendPaymentFailedEmail(customer.email);
        
        // Update tags for payment issues
        const ghlContact: GHLContact = {
          email: customer.email,
          tags: ['payment-failed', 'at-risk'],
        };
        
        await createOrUpdateGHLContact(ghlContact);

        // Trigger payment reminder campaign
        const paymentReminderCampaignId = 'payment-reminder-campaign-id'; // Configure this
        await triggerGHLCampaign(customer.email, paymentReminderCampaignId);
      }
    }

  } catch (error) {
    console.error('Error processing failed payment:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Processing customer.created:', customer.id);

  try {
    if (customer.email) {
      const ghlContact: GHLContact = {
        email: customer.email,
        firstName: customer.name?.split(' ')[0],
        lastName: customer.name?.split(' ').slice(1).join(' '),
        phone: customer.phone || undefined,
        tags: ['stripe-customer'],
      };
      
      await createOrUpdateGHLContact(ghlContact);
    }

  } catch (error) {
    console.error('Error processing customer creation:', error);
  }
}

// Helper functions
function getProductDisplayName(productId?: string): string {
  const productNames: Record<string, string> = {
    'hodos': 'HODOS',
    'marketing': 'HODOS Marketing Platform',
    'video': 'HODOS Video Agents',
  };
  
  return productNames[productId || ''] || 'HODOS Product';
}

function getTierDisplayName(tierId?: string): string {
  if (!tierId) return 'Plan';
  
  const parts = tierId.split('-');
  const tier = parts[parts.length - 1];
  
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function getOnboardingCampaignId(productId?: string): string | null {
  const campaignIds: Record<string, string> = {
    'hodos': 'hodos-onboarding-campaign',
    'marketing': 'marketing-onboarding-campaign',
    'video': 'video-onboarding-campaign',
  };
  
  return campaignIds[productId || ''] || null;
}

// GET endpoint for webhook verification (Stripe sometimes sends GET requests)
export async function GET() {
  return NextResponse.json({ message: 'Stripe webhook endpoint' });
}