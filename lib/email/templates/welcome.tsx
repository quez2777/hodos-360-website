import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Font,
  Row,
  Column,
} from '@react-email/components'

interface WelcomeEmailProps {
  recipientEmail: string
  recipientName?: string
  subscriptionType?: 'newsletter' | 'trial' | 'demo' | 'contact'
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hodos360.com'

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  recipientEmail,
  recipientName,
  subscriptionType = 'newsletter',
}) => {
  const previewText = 'Welcome to HODOS 360 - The Future of Legal Tech'
  const displayName = recipientName || recipientEmail.split('@')[0]

  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Img
              src={`${baseUrl}/images/logo.png`}
              width="150"
              height="50"
              alt="HODOS 360"
              style={logo}
            />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Img
              src={`${baseUrl}/images/welcome-hero.png`}
              width="600"
              height="300"
              alt="Welcome to HODOS 360"
              style={heroImage}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={heading}>Welcome to the Future of Legal Tech!</Text>
            
            <Text style={greeting}>Hi {displayName},</Text>
            
            <Text style={paragraph}>
              Thank you for {subscriptionType === 'newsletter' 
                ? 'subscribing to our newsletter' 
                : subscriptionType === 'trial'
                ? 'starting your free trial'
                : subscriptionType === 'demo'
                ? 'scheduling a demo with us'
                : 'reaching out to us'}! 
              We're thrilled to have you join the HODOS 360 community.
            </Text>

            <Text style={paragraph}>
              HODOS 360 is transforming how law firms operate with our suite of 
              AI-powered tools designed specifically for legal professionals. 
              From intelligent document management to automated marketing campaigns, 
              we're here to help your firm thrive in the digital age.
            </Text>

            {/* Product Cards */}
            <Text style={sectionHeading}>Our Flagship Products</Text>
            
            <Section style={productGrid}>
              {/* HODOS Product */}
              <Section style={productCard}>
                <div style={productIcon}>⚖️</div>
                <Text style={productTitle}>HODOS</Text>
                <Text style={productDescription}>
                  Complete AI law firm management system with intelligent case handling,
                  document automation, and client portal.
                </Text>
                <Link href={`${baseUrl}/products/hodos`} style={productLink}>
                  Learn more →
                </Link>
              </Section>

              {/* Marketing Platform */}
              <Section style={productCard}>
                <div style={productIcon}>🚀</div>
                <Text style={productTitle}>HODOS Marketing</Text>
                <Text style={productDescription}>
                  AI-powered SEO and paid marketing platform that generates leads
                  on autopilot for your law firm.
                </Text>
                <Link href={`${baseUrl}/products/marketing`} style={productLink}>
                  Learn more →
                </Link>
              </Section>

              {/* Video Agents */}
              <Section style={productCard}>
                <div style={productIcon}>🎥</div>
                <Text style={productTitle}>HODOS VIDEO Agents</Text>
                <Text style={productDescription}>
                  24/7 AI video receptionists and intake specialists that never
                  miss a potential client.
                </Text>
                <Link href={`${baseUrl}/products/video-agents`} style={productLink}>
                  Learn more →
                </Link>
              </Section>
            </Section>

            {/* Resources Section */}
            <Hr style={divider} />
            
            <Text style={sectionHeading}>Get Started</Text>
            <Text style={paragraph}>
              Here are some resources to help you make the most of HODOS 360:
            </Text>

            <Section style={resourceList}>
              <Row style={resourceRow}>
                <Column style={resourceIcon}>📚</Column>
                <Column style={resourceContent}>
                  <Link href={`${baseUrl}/resources/guides`} style={resourceLink}>
                    Implementation Guides
                  </Link>
                  <Text style={resourceDescription}>
                    Step-by-step guides to get your firm up and running
                  </Text>
                </Column>
              </Row>

              <Row style={resourceRow}>
                <Column style={resourceIcon}>🎓</Column>
                <Column style={resourceContent}>
                  <Link href={`${baseUrl}/resources/webinars`} style={resourceLink}>
                    Free Webinars
                  </Link>
                  <Text style={resourceDescription}>
                    Join our weekly sessions on legal tech best practices
                  </Text>
                </Column>
              </Row>

              <Row style={resourceRow}>
                <Column style={resourceIcon}>💬</Column>
                <Column style={resourceContent}>
                  <Link href={`${baseUrl}/support`} style={resourceLink}>
                    24/7 Support
                  </Link>
                  <Text style={resourceDescription}>
                    Our team is always here to help you succeed
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* CTA Section */}
            <Section style={ctaSection}>
              <Text style={ctaHeading}>Ready to Transform Your Practice?</Text>
              <Button style={primaryButton} href={`${baseUrl}/demo`}>
                Schedule Your Free Demo
              </Button>
            </Section>

            {/* Newsletter Signup (if not already subscribed) */}
            {subscriptionType !== 'newsletter' && (
              <>
                <Hr style={divider} />
                <Section style={newsletterSection}>
                  <Text style={newsletterHeading}>Stay Updated</Text>
                  <Text style={newsletterText}>
                    Get the latest legal tech insights and product updates delivered
                    to your inbox.
                  </Text>
                  <Button style={secondaryButton} href={`${baseUrl}/newsletter`}>
                    Subscribe to Newsletter
                  </Button>
                </Section>
              </>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Reply to this email or call{' '}
              <Link href="tel:1-800-HODOS360" style={footerLink}>
                1-800-HODOS360
              </Link>
            </Text>
            
            <Section style={socialLinks}>
              <Link href="https://linkedin.com/company/hodos360" style={socialLink}>
                <Img
                  src={`${baseUrl}/images/linkedin.png`}
                  width="24"
                  height="24"
                  alt="LinkedIn"
                />
              </Link>
              <Link href="https://twitter.com/hodos360" style={socialLink}>
                <Img
                  src={`${baseUrl}/images/twitter.png`}
                  width="24"
                  height="24"
                  alt="Twitter"
                />
              </Link>
              <Link href="https://youtube.com/hodos360" style={socialLink}>
                <Img
                  src={`${baseUrl}/images/youtube.png`}
                  width="24"
                  height="24"
                  alt="YouTube"
                />
              </Link>
            </Section>

            <Text style={footerLinks}>
              <Link href={baseUrl} style={footerLink}>
                hodos360.com
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terms of Service
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/unsubscribe?email=${recipientEmail}`} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
            
            <Text style={copyright}>
              © 2024 HODOS 360 LLC. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 32px 0',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
}

const heroSection = {
  padding: '0',
}

const heroImage = {
  width: '100%',
  height: 'auto',
  display: 'block',
}

const content = {
  padding: '32px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '16px',
}

const paragraph = {
  fontSize: '16px',
  color: '#444444',
  lineHeight: '1.6',
  marginBottom: '24px',
}

const sectionHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginTop: '32px',
  marginBottom: '20px',
}

const productGrid = {
  marginBottom: '32px',
}

const productCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '16px',
  textAlign: 'center' as const,
}

const productIcon = {
  fontSize: '36px',
  marginBottom: '12px',
}

const productTitle = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '8px',
}

const productDescription = {
  fontSize: '14px',
  color: '#666666',
  lineHeight: '1.5',
  marginBottom: '12px',
}

const productLink = {
  fontSize: '14px',
  color: '#2B4C8C',
  fontWeight: '600',
  textDecoration: 'none',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const resourceList = {
  marginBottom: '32px',
}

const resourceRow = {
  marginBottom: '20px',
}

const resourceIcon = {
  width: '40px',
  fontSize: '24px',
  verticalAlign: 'top' as const,
}

const resourceContent = {
  paddingLeft: '12px',
  verticalAlign: 'top' as const,
}

const resourceLink = {
  fontSize: '16px',
  color: '#2B4C8C',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'block',
  marginBottom: '4px',
}

const resourceDescription = {
  fontSize: '14px',
  color: '#666666',
  margin: '0',
}

const ctaSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '32px',
  textAlign: 'center' as const,
  marginTop: '32px',
}

const ctaHeading = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '16px',
}

const buttonBase = {
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
}

const primaryButton = {
  ...buttonBase,
  backgroundColor: '#2B4C8C',
  color: '#ffffff',
}

const secondaryButton = {
  ...buttonBase,
  backgroundColor: '#ffffff',
  color: '#2B4C8C',
  border: '2px solid #2B4C8C',
}

const newsletterSection = {
  textAlign: 'center' as const,
  marginTop: '32px',
}

const newsletterHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '8px',
}

const newsletterText = {
  fontSize: '14px',
  color: '#666666',
  marginBottom: '16px',
}

const footer = {
  padding: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
}

const footerText = {
  fontSize: '14px',
  color: '#666666',
  marginBottom: '16px',
}

const socialLinks = {
  marginBottom: '16px',
}

const socialLink = {
  display: 'inline-block',
  margin: '0 8px',
}

const footerLinks = {
  fontSize: '12px',
  color: '#999999',
  marginBottom: '8px',
}

const footerLink = {
  color: '#999999',
  textDecoration: 'underline',
  margin: '0 4px',
}

const copyright = {
  fontSize: '12px',
  color: '#999999',
  marginTop: '8px',
}

export default WelcomeEmail