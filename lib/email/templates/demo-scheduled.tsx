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

interface DemoScheduledEmailProps {
  recipientName?: string
  recipientEmail: string
  demoDate: string
  demoTime: string
  demoType: 'video-call' | 'in-person' | 'phone'
  meetingLink?: string
  calendarLink?: string
  duration?: string
  specialRequests?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hodos360.com'

export const DemoScheduledEmail: React.FC<DemoScheduledEmailProps> = ({
  recipientName,
  recipientEmail,
  demoDate,
  demoTime,
  demoType = 'video-call',
  meetingLink,
  calendarLink,
  duration = '30 minutes',
  specialRequests,
}) => {
  const previewText = `Your HODOS 360 demo is scheduled for ${demoDate} at ${demoTime}`
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
            <div style={checkmarkContainer}>
              <Img
                src={`${baseUrl}/images/checkmark.png`}
                width="64"
                height="64"
                alt="Success"
                style={checkmark}
              />
            </div>
            <Text style={heroHeading}>Demo Scheduled!</Text>
            <Text style={heroSubheading}>
              We're excited to show you how HODOS 360 can transform your law firm
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hi {displayName},</Text>
            
            <Text style={paragraph}>
              Thank you for scheduling a demo with HODOS 360. We're looking forward to
              showing you how our AI-powered legal tech solutions can revolutionize your
              practice.
            </Text>

            {/* Meeting Details Card */}
            <Section style={detailsCard}>
              <Text style={cardHeading}>Your Demo Details</Text>
              
              <Row style={detailRow}>
                <Column style={iconColumn}>📅</Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Date</Text>
                  <Text style={detailValue}>{demoDate}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={iconColumn}>🕐</Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Time</Text>
                  <Text style={detailValue}>{demoTime}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={iconColumn}>⏱️</Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Duration</Text>
                  <Text style={detailValue}>{duration}</Text>
                </Column>
              </Row>

              <Row style={detailRow}>
                <Column style={iconColumn}>
                  {demoType === 'video-call' ? '💻' : demoType === 'phone' ? '📞' : '🏢'}
                </Column>
                <Column style={detailColumn}>
                  <Text style={detailLabel}>Meeting Type</Text>
                  <Text style={detailValue}>
                    {demoType === 'video-call' 
                      ? 'Video Call' 
                      : demoType === 'phone' 
                      ? 'Phone Call' 
                      : 'In-Person Meeting'}
                  </Text>
                </Column>
              </Row>

              {specialRequests && (
                <Row style={detailRow}>
                  <Column style={iconColumn}>📝</Column>
                  <Column style={detailColumn}>
                    <Text style={detailLabel}>Your Requests</Text>
                    <Text style={detailValue}>{specialRequests}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            {/* Action Buttons */}
            <Section style={buttonSection}>
              {meetingLink && (
                <Button style={primaryButton} href={meetingLink}>
                  Join Video Call
                </Button>
              )}
              {calendarLink && (
                <Button style={secondaryButton} href={calendarLink}>
                  Add to Calendar
                </Button>
              )}
            </Section>

            {/* What to Expect */}
            <Section style={expectSection}>
              <Text style={sectionHeading}>What to Expect</Text>
              <ul style={bulletList}>
                <li style={bulletItem}>
                  Live demonstration of our AI-powered legal tools
                </li>
                <li style={bulletItem}>
                  Customized walkthrough based on your firm's needs
                </li>
                <li style={bulletItem}>
                  Q&A session with our product experts
                </li>
                <li style={bulletItem}>
                  Pricing and implementation timeline discussion
                </li>
              </ul>
            </Section>

            {/* Prepare Section */}
            <Section style={prepareSection}>
              <Text style={sectionHeading}>How to Prepare</Text>
              <Text style={paragraph}>
                To make the most of our time together, consider:
              </Text>
              <ul style={bulletList}>
                <li style={bulletItem}>
                  Current challenges you'd like to solve
                </li>
                <li style={bulletItem}>
                  Your firm's workflow and processes
                </li>
                <li style={bulletItem}>
                  Questions about our features and capabilities
                </li>
              </ul>
            </Section>

            <Hr style={divider} />

            {/* Support */}
            <Text style={supportText}>
              Need to reschedule or have questions? Reply to this email or call us at{' '}
              <Link href="tel:1-800-HODOS360" style={link}>
                1-800-HODOS360
              </Link>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              We're excited to show you the future of legal tech!
            </Text>
            <Text style={footerText}>
              The HODOS 360 Team
            </Text>
            <Text style={footerLinks}>
              <Link href={baseUrl} style={footerLink}>
                hodos360.com
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/products`} style={footerLink}>
                Our Products
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/resources`} style={footerLink}>
                Resources
              </Link>
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
  padding: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
}

const checkmarkContainer = {
  marginBottom: '16px',
}

const checkmark = {
  margin: '0 auto',
}

const heroHeading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '16px 0 8px',
}

const heroSubheading = {
  fontSize: '16px',
  color: '#666666',
  margin: '0',
}

const content = {
  padding: '32px',
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

const detailsCard = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '32px',
}

const cardHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '20px',
}

const detailRow = {
  marginBottom: '16px',
}

const iconColumn = {
  width: '40px',
  fontSize: '24px',
  verticalAlign: 'top' as const,
}

const detailColumn = {
  paddingLeft: '12px',
  verticalAlign: 'top' as const,
}

const detailLabel = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 4px',
}

const detailValue = {
  fontSize: '16px',
  color: '#1a1a1a',
  fontWeight: '500',
  margin: '0',
}

const buttonSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const buttonBase = {
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 28px',
  margin: '0 8px',
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

const expectSection = {
  marginBottom: '32px',
}

const prepareSection = {
  marginBottom: '32px',
}

const sectionHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  marginBottom: '12px',
}

const bulletList = {
  marginTop: '12px',
  paddingLeft: '20px',
}

const bulletItem = {
  fontSize: '15px',
  color: '#444444',
  lineHeight: '1.6',
  marginBottom: '8px',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const supportText = {
  fontSize: '15px',
  color: '#666666',
  textAlign: 'center' as const,
  lineHeight: '1.6',
}

const link = {
  color: '#2B4C8C',
  textDecoration: 'underline',
}

const footer = {
  padding: '32px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
}

const footerText = {
  fontSize: '14px',
  color: '#666666',
  margin: '4px 0',
}

const footerLinks = {
  fontSize: '14px',
  color: '#999999',
  marginTop: '16px',
}

const footerLink = {
  color: '#999999',
  textDecoration: 'underline',
  margin: '0 4px',
}

export default DemoScheduledEmail