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
} from '@react-email/components'

interface ContactEmailProps {
  firstName: string
  lastName: string
  email: string
  company: string
  firmSize?: string
  practiceAreas?: string[]
  message: string
  timestamp?: string
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hodos360.com'

export const ContactEmail: React.FC<ContactEmailProps> = ({
  firstName,
  lastName,
  email,
  company,
  firmSize,
  practiceAreas,
  message,
  timestamp = new Date().toISOString(),
}) => {
  const previewText = `New contact from ${firstName} ${lastName} at ${company}`

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

          {/* Main Content */}
          <Section style={content}>
            <Text style={heading}>New Contact Form Submission</Text>
            
            <Section style={infoSection}>
              <Text style={label}>Contact Information</Text>
              <Text style={value}>
                <strong>Name:</strong> {firstName} {lastName}
              </Text>
              <Text style={value}>
                <strong>Email:</strong>{' '}
                <Link href={`mailto:${email}`} style={link}>
                  {email}
                </Link>
              </Text>
              <Text style={value}>
                <strong>Company:</strong> {company}
              </Text>
              {firmSize && (
                <Text style={value}>
                  <strong>Firm Size:</strong> {firmSize}
                </Text>
              )}
              {practiceAreas && practiceAreas.length > 0 && (
                <Text style={value}>
                  <strong>Practice Areas:</strong> {practiceAreas.join(', ')}
                </Text>
              )}
            </Section>

            <Hr style={divider} />

            <Section style={messageSection}>
              <Text style={label}>Message</Text>
              <Text style={messageText}>{message}</Text>
            </Section>

            <Hr style={divider} />

            {/* Action Buttons */}
            <Section style={buttonSection}>
              <Button
                style={primaryButton}
                href={`mailto:${email}?subject=Re: Your HODOS 360 Inquiry`}
              >
                Reply to {firstName}
              </Button>
              <Button
                style={secondaryButton}
                href={`${baseUrl}/admin/contacts`}
              >
                View in Dashboard
              </Button>
            </Section>

            {/* Footer */}
            <Text style={footer}>
              Submitted on {new Date(timestamp).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </Text>
          </Section>

          {/* Email Footer */}
          <Section style={emailFooter}>
            <Text style={footerText}>
              This is an internal notification from HODOS 360.
            </Text>
            <Text style={footerText}>
              <Link href={baseUrl} style={footerLink}>
                hodos360.com
              </Link>{' '}
              •{' '}
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
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
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  padding: '32px 32px 0',
}

const logo = {
  margin: '0 auto',
}

const content = {
  padding: '0 32px',
}

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '32px 0 24px',
}

const infoSection = {
  marginBottom: '24px',
}

const label = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#666666',
  marginBottom: '8px',
}

const value = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '4px 0',
}

const link = {
  color: '#2B4C8C',
  textDecoration: 'underline',
}

const divider = {
  borderColor: '#e6e6e6',
  margin: '24px 0',
}

const messageSection = {
  marginBottom: '24px',
}

const messageText = {
  fontSize: '16px',
  color: '#1a1a1a',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}

const buttonSection = {
  marginTop: '32px',
  textAlign: 'center' as const,
}

const buttonBase = {
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
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

const footer = {
  fontSize: '14px',
  color: '#999999',
  marginTop: '32px',
  textAlign: 'center' as const,
}

const emailFooter = {
  padding: '32px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '12px',
  color: '#999999',
  margin: '4px 0',
}

const footerLink = {
  color: '#999999',
  textDecoration: 'underline',
}

export default ContactEmail