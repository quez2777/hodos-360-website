/**
 * Success Page - Post-Checkout Confirmation
 * 
 * Displays success message after completed Stripe checkout,
 * retrieves session data, and shows next steps.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/stripe/products';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CheckoutSession {
  id: string;
  status: string;
  customerEmail: string;
  amountTotal: number;
  currency: string;
  metadata: {
    productId?: string;
    tierId?: string;
    billingPeriod?: string;
  };
}

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const productId = searchParams.get('product');
  const tierId = searchParams.get('tier');

  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const response = await fetch(`/api/stripe/create-checkout?session_id=${sessionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retrieve session data');
      }

      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getProductInfo = () => {
    const productNames: Record<string, string> = {
      'hodos': 'HODOS',
      'marketing': 'HODOS Marketing Platform',
      'video': 'HODOS Video Agents',
    };

    const tierNames: Record<string, string> = {
      'starter': 'Starter',
      'professional': 'Professional',
      'enterprise': 'Enterprise',
    };

    const productName = productNames[productId || session?.metadata.productId || ''] || 'HODOS Product';
    const tierName = tierNames[tierId?.split('-').pop() || session?.metadata.tierId?.split('-').pop() || ''] || 'Plan';

    return { productName, tierName };
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white/70">Loading your order details...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !session) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-white">Unable to Load Order</h1>
            <p className="text-white/70">{error || 'Session not found'}</p>
            <Button asChild>
              <Link href="/pricing">Return to Pricing</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const { productName, tierName } = getProductInfo();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="text-8xl">🎉</div>
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg px-4 py-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Payment Successful
                </Badge>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Welcome to {productName}!
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Your subscription is now active. We're excited to help transform your law firm with cutting-edge AI technology.
                </p>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-black/20 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Product</span>
                    <span className="text-white font-semibold">{productName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Plan</span>
                    <span className="text-white font-semibold">{tierName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Email</span>
                    <span className="text-white">{session.customerEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Order ID</span>
                    <span className="text-white font-mono text-sm">{session.id}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-white">Total Paid</span>
                      <span className="text-white">
                        {formatPrice(session.amountTotal / 100)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="bg-black/20 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-blue-400" />
                    Check Your Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/70">
                    We've sent detailed setup instructions and your login credentials to{' '}
                    <span className="text-blue-400">{session.customerEmail}</span>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <span className="text-green-400">✓</span>
                      <span>Welcome email with getting started guide</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <span className="text-green-400">✓</span>
                      <span>Login credentials and account setup</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <span className="text-green-400">✓</span>
                      <span>Training resources and video tutorials</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/20 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                    Schedule Onboarding
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/70">
                    Book a free onboarding session with our experts to get you up and running quickly.
                  </p>
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    asChild
                  >
                    <Link href="/demo">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Onboarding Call
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support & Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-black/20 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Need Help Getting Started?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-white/70">
                    Our team is here to ensure your success. Here are the best ways to get support:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Call Support</h3>
                        <p className="text-sm text-white/60">1-800-HODOS-AI</p>
                        <p className="text-xs text-white/50">24/7 Available</p>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center mx-auto">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Email Support</h3>
                        <p className="text-sm text-white/60">support@hodos360.com</p>
                        <p className="text-xs text-white/50">Response within 2 hours</p>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center mx-auto">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Help Center</h3>
                        <p className="text-sm text-white/60">docs.hodos360.com</p>
                        <p className="text-xs text-white/50">Guides & Tutorials</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                asChild
              >
                <Link href="/demo">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Onboarding
                </Link>
              </Button>
              
              <Button 
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8"
                asChild
              >
                <Link href="/">
                  Return to Homepage
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}