/**
 * HODOS 360 Pricing Table Component
 * 
 * Beautiful, responsive pricing table with glassmorphism design,
 * feature comparisons, and Stripe checkout integration.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Check, X, Star, Sparkles } from 'lucide-react';
import { products, formatPrice, type Product, type PricingTier } from '@/lib/stripe/products';
import { motion, AnimatePresence } from 'framer-motion';

interface PricingTableProps {
  selectedProduct?: string;
  className?: string;
}

export function PricingTable({ selectedProduct, className = '' }: PricingTableProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (productId: string, tierId: string) => {
    setLoading(tierId);
    
    try {
      // Get UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmParams = {
        source: urlParams.get('utm_source') || undefined,
        medium: urlParams.get('utm_medium') || undefined,
        campaign: urlParams.get('utm_campaign') || undefined,
        term: urlParams.get('utm_term') || undefined,
        content: urlParams.get('utm_content') || undefined,
      };

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          tierId,
          billingPeriod,
          utmParams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const displayProducts = selectedProduct 
    ? products.filter(p => p.id === selectedProduct)
    : products;

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center space-x-4">
        <span className={`text-sm font-medium transition-colors ${
          billingPeriod === 'monthly' ? 'text-white' : 'text-white/60'
        }`}>
          Monthly
        </span>
        <Switch
          checked={billingPeriod === 'annual'}
          onCheckedChange={(checked) => setBillingPeriod(checked ? 'annual' : 'monthly')}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600"
        />
        <span className={`text-sm font-medium transition-colors ${
          billingPeriod === 'annual' ? 'text-white' : 'text-white/60'
        }`}>
          Annual
        </span>
        {billingPeriod === 'annual' && (
          <Badge variant="secondary" className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30">
            <Sparkles className="w-3 h-3 mr-1" />
            Save up to 20%
          </Badge>
        )}
      </div>

      {/* Products Tabs */}
      <Tabs defaultValue={selectedProduct || products[0].id} className="w-full">
        {!selectedProduct && (
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-black/20 backdrop-blur-sm border border-white/10">
            {products.map((product) => (
              <TabsTrigger
                key={product.id}
                value={product.id}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <span className="mr-2">{product.icon}</span>
                {product.name.replace('HODOS ', '')}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {displayProducts.map((product) => (
          <TabsContent key={product.id} value={product.id} className="space-y-8">
            {/* Product Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="text-6xl mb-4">{product.icon}</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                {product.name}
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                {product.description}
              </p>
            </motion.div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {product.tiers.map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card className={`relative overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                    tier.popular
                      ? 'border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-br from-blue-500/10 to-purple-500/10'
                      : 'border-white/20 bg-black/20'
                  } backdrop-blur-sm`}>
                    {tier.popular && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-2xl font-bold text-white">
                        {tier.name}
                      </CardTitle>
                      <p className="text-white/60">{tier.description}</p>
                      
                      <div className="space-y-2">
                        <div className="text-4xl font-bold text-white">
                          {formatPrice(billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice)}
                          <span className="text-lg font-normal text-white/60">
                            /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                        
                        {billingPeriod === 'annual' && tier.annualSavings > 0 && (
                          <p className="text-sm text-green-400">
                            Save {formatPrice(tier.annualSavings)} annually
                          </p>
                        )}
                        
                        {tier.trialDays && (
                          <p className="text-sm text-blue-400">
                            {tier.trialDays}-day free trial
                          </p>
                        )}

                        {tier.setupFee && (
                          <p className="text-sm text-orange-400">
                            + {formatPrice(tier.setupFee)} setup fee
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Features List */}
                      <div className="space-y-3">
                        {tier.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start space-x-3">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <span className={feature.included ? 'text-white' : 'text-white/40'}>
                                {feature.name}
                              </span>
                              {feature.value && (
                                <span className="text-white/60 text-sm ml-2">
                                  ({feature.value})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Button
                        onClick={() => handleCheckout(product.id, tier.id)}
                        disabled={loading === tier.id}
                        className={`w-full py-3 text-lg font-semibold transition-all duration-300 ${
                          tier.popular
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {loading === tier.id ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center space-x-2"
                            >
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span>Processing...</span>
                            </motion.div>
                          ) : (
                            <motion.span
                              key="cta"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              {tier.trialDays ? `Start ${tier.trialDays}-Day Trial` : 'Get Started'}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Button>

                      <p className="text-xs text-white/40 text-center">
                        No setup fees • Cancel anytime • 30-day money-back guarantee
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Benefits Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-black/20 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-bold text-white">
                    Why Choose {product.name}?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-white/80">{benefit}</p>
                      </div>
                    ))}
                  </div>

                  {product.testimonial && (
                    <div className="mt-8 p-6 rounded-lg bg-white/5 border border-white/10">
                      <blockquote className="text-white/90 text-lg italic mb-4">
                        "{product.testimonial.quote}"
                      </blockquote>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {product.testimonial.author.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">{product.testimonial.author}</p>
                          <p className="text-white/60">{product.testimonial.role}, {product.testimonial.company}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}