/**
 * HODOS 360 API Type Definitions
 * Central type definitions for all API entities and responses
 */

// ============================================
// AUTHENTICATION & USER MANAGEMENT TYPES
// ============================================

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  firmId?: string
  barNumber?: string
  jurisdiction?: string[]
  specializations?: string[]
  profileImageUrl?: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Firm {
  id: string
  name: string
  domain: string
  logo?: string
  address: Address
  phone: string
  website?: string
  size: FirmSize
  practiceAreas: string[]
  subscription: Subscription
  settings: FirmSettings
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  suite?: string
  city: string
  state: string
  zipCode: string
  country: string
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FIRM_ADMIN = 'FIRM_ADMIN',
  PARTNER = 'PARTNER',
  ASSOCIATE = 'ASSOCIATE',
  PARALEGAL = 'PARALEGAL',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  CLIENT = 'CLIENT'
}

export enum FirmSize {
  SOLO = 'SOLO',
  SMALL = 'SMALL', // 2-10
  MEDIUM = 'MEDIUM', // 11-50
  LARGE = 'LARGE', // 51-200
  ENTERPRISE = 'ENTERPRISE' // 200+
}

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  seats: number
  addons: string[]
}

export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID',
  TRIALING = 'TRIALING'
}

export interface FirmSettings {
  timezone: string
  dateFormat: string
  currency: string
  billingEmail: string
  notifications: NotificationSettings
  integrations: IntegrationSettings
  security: SecuritySettings
}

export interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  dailyDigest: boolean
  weeklyReport: boolean
}

export interface IntegrationSettings {
  googleCalendar?: boolean
  outlookCalendar?: boolean
  quickbooks?: boolean
  dropbox?: boolean
  googleDrive?: boolean
  slack?: boolean
}

export interface SecuritySettings {
  requireTwoFactor: boolean
  sessionTimeout: number // minutes
  ipWhitelist?: string[]
  passwordPolicy: PasswordPolicy
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  expirationDays?: number
}

// ============================================
// AI SERVICES TYPES
// ============================================

export interface Document {
  id: string
  firmId: string
  uploadedBy: string
  title: string
  type: DocumentType
  mimeType: string
  size: number // bytes
  url: string
  metadata: DocumentMetadata
  analysis?: DocumentAnalysis
  tags: string[]
  caseId?: string
  clientId?: string
  createdAt: Date
  updatedAt: Date
}

export enum DocumentType {
  CONTRACT = 'CONTRACT',
  BRIEF = 'BRIEF',
  MOTION = 'MOTION',
  PLEADING = 'PLEADING',
  DISCOVERY = 'DISCOVERY',
  CORRESPONDENCE = 'CORRESPONDENCE',
  COURT_ORDER = 'COURT_ORDER',
  EVIDENCE = 'EVIDENCE',
  OTHER = 'OTHER'
}

export interface DocumentMetadata {
  pageCount: number
  wordCount: number
  language: string
  extractedText?: string
  ocrProcessed?: boolean
  confidentialityLevel: ConfidentialityLevel
}

export enum ConfidentialityLevel {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  HIGHLY_CONFIDENTIAL = 'HIGHLY_CONFIDENTIAL',
  PRIVILEGED = 'PRIVILEGED'
}

export interface DocumentAnalysis {
  id: string
  documentId: string
  summary: string
  keyPoints: string[]
  risks: Risk[]
  obligations: Obligation[]
  parties: Party[]
  dates: ImportantDate[]
  amounts: MonetaryAmount[]
  clauses: Clause[]
  sentiment: SentimentAnalysis
  completedAt: Date
}

export interface Risk {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  mitigation?: string
  location: DocumentLocation
}

export interface Obligation {
  id: string
  party: string
  description: string
  dueDate?: Date
  type: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  location: DocumentLocation
}

export interface Party {
  name: string
  role: string
  type: 'INDIVIDUAL' | 'ORGANIZATION'
  contact?: ContactInfo
}

export interface ContactInfo {
  email?: string
  phone?: string
  address?: Address
}

export interface ImportantDate {
  date: Date
  description: string
  type: string
  location: DocumentLocation
}

export interface MonetaryAmount {
  amount: number
  currency: string
  description: string
  type: string
  location: DocumentLocation
}

export interface Clause {
  id: string
  type: string
  title: string
  content: string
  location: DocumentLocation
  flags?: string[]
}

export interface DocumentLocation {
  page: number
  paragraph?: number
  startOffset?: number
  endOffset?: number
}

export interface SentimentAnalysis {
  overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  favorability: number // -1 to 1
  confidence: number // 0 to 1
}

export interface CaseResearch {
  id: string
  query: string
  jurisdiction: string[]
  dateRange?: DateRange
  practiceArea?: string
  results: CaseResult[]
  analysis: ResearchAnalysis
  createdAt: Date
}

export interface DateRange {
  start: Date
  end: Date
}

export interface CaseResult {
  id: string
  citation: string
  caseName: string
  court: string
  date: Date
  summary: string
  relevanceScore: number
  keyPassages: KeyPassage[]
  shepardSignal?: ShepardSignal
}

export interface KeyPassage {
  text: string
  page: number
  relevance: number
}

export enum ShepardSignal {
  POSITIVE = 'POSITIVE',
  DISTINGUISHED = 'DISTINGUISHED',
  QUESTIONED = 'QUESTIONED',
  OVERRULED = 'OVERRULED',
  SUPERSEDED = 'SUPERSEDED'
}

export interface ResearchAnalysis {
  summary: string
  trends: string[]
  recommendations: string[]
  counterArguments: string[]
  strength: 'WEAK' | 'MODERATE' | 'STRONG'
}

export interface ContractTemplate {
  id: string
  firmId: string
  name: string
  type: string
  description: string
  variables: TemplateVariable[]
  content: string
  language: string
  jurisdiction: string[]
  lastUsed?: Date
  usageCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface TemplateVariable {
  name: string
  type: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'SELECT'
  required: boolean
  defaultValue?: any
  options?: string[] // for SELECT type
  validation?: ValidationRule
}

export interface ValidationRule {
  pattern?: string
  min?: number
  max?: number
  message: string
}

export interface ChatSession {
  id: string
  userId: string
  type: ChatType
  title: string
  messages: ChatMessage[]
  context?: ChatContext
  status: 'ACTIVE' | 'ARCHIVED'
  createdAt: Date
  updatedAt: Date
}

export enum ChatType {
  GENERAL = 'GENERAL',
  DOCUMENT_REVIEW = 'DOCUMENT_REVIEW',
  CASE_RESEARCH = 'CASE_RESEARCH',
  CONTRACT_DRAFTING = 'CONTRACT_DRAFTING',
  LEGAL_ADVICE = 'LEGAL_ADVICE'
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  attachments?: Attachment[]
  citations?: Citation[]
  timestamp: Date
}

export interface Attachment {
  id: string
  type: 'DOCUMENT' | 'IMAGE' | 'LINK'
  name: string
  url: string
  size?: number
}

export interface Citation {
  id: string
  type: 'CASE' | 'STATUTE' | 'REGULATION' | 'DOCUMENT'
  reference: string
  url?: string
  excerpt?: string
}

export interface ChatContext {
  caseId?: string
  documentIds?: string[]
  clientId?: string
  practiceArea?: string
}

// ============================================
// CLIENT MANAGEMENT TYPES
// ============================================

export interface Client {
  id: string
  firmId: string
  type: 'INDIVIDUAL' | 'BUSINESS'
  firstName?: string
  lastName?: string
  businessName?: string
  email: string
  phone: string
  address: Address
  dateOfBirth?: Date
  ssn?: string // encrypted
  ein?: string // for businesses
  preferredContactMethod: ContactMethod
  tags: string[]
  notes?: string
  status: ClientStatus
  source: ClientSource
  referredBy?: string
  createdAt: Date
  updatedAt: Date
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  MAIL = 'MAIL'
}

export enum ClientStatus {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export enum ClientSource {
  REFERRAL = 'REFERRAL',
  WEBSITE = 'WEBSITE',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  ADVERTISING = 'ADVERTISING',
  DIRECT = 'DIRECT',
  OTHER = 'OTHER'
}

export interface Intake {
  id: string
  firmId: string
  clientId?: string
  type: IntakeType
  status: IntakeStatus
  assignedTo?: string
  data: IntakeData
  documents: string[] // document IDs
  notes: IntakeNote[]
  scheduledConsultation?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export enum IntakeType {
  PERSONAL_INJURY = 'PERSONAL_INJURY',
  FAMILY_LAW = 'FAMILY_LAW',
  CRIMINAL_DEFENSE = 'CRIMINAL_DEFENSE',
  ESTATE_PLANNING = 'ESTATE_PLANNING',
  BUSINESS_LAW = 'BUSINESS_LAW',
  REAL_ESTATE = 'REAL_ESTATE',
  IMMIGRATION = 'IMMIGRATION',
  GENERAL = 'GENERAL'
}

export enum IntakeStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REFERRED = 'REFERRED'
}

export interface IntakeData {
  // Dynamic based on intake type
  [key: string]: any
}

export interface IntakeNote {
  id: string
  authorId: string
  content: string
  isInternal: boolean
  createdAt: Date
}

export interface Case {
  id: string
  firmId: string
  clientId: string
  caseNumber: string
  title: string
  type: string
  status: CaseStatus
  priority: Priority
  assignedAttorneys: string[] // user IDs
  assignedStaff: string[] // user IDs
  practiceArea: string
  court?: Court
  opposingCounsel?: OpposingCounsel[]
  importantDates: CaseDate[]
  documents: string[] // document IDs
  notes: CaseNote[]
  timeEntries: string[] // time entry IDs
  billing: BillingSummary
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  DISCOVERY = 'DISCOVERY',
  TRIAL = 'TRIAL',
  SETTLEMENT = 'SETTLEMENT',
  CLOSED = 'CLOSED',
  APPEALED = 'APPEALED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Court {
  name: string
  type: string
  jurisdiction: string
  address: Address
  judge?: string
  caseNumber?: string
}

export interface OpposingCounsel {
  name: string
  firm: string
  email?: string
  phone?: string
  barNumber?: string
}

export interface CaseDate {
  id: string
  type: string
  description: string
  date: Date
  location?: string
  reminder?: ReminderSettings
}

export interface ReminderSettings {
  enabled: boolean
  daysBefore: number
  time: string // HH:MM format
}

export interface CaseNote {
  id: string
  authorId: string
  content: string
  isInternal: boolean
  attachments?: string[] // document IDs
  createdAt: Date
  updatedAt: Date
}

export interface BillingSummary {
  totalHours: number
  totalAmount: number
  billedAmount: number
  paidAmount: number
  outstandingAmount: number
  lastInvoiceDate?: Date
}

export interface Communication {
  id: string
  firmId: string
  caseId?: string
  clientId?: string
  type: CommunicationType
  direction: 'INBOUND' | 'OUTBOUND'
  subject?: string
  content: string
  from: CommunicationParty
  to: CommunicationParty[]
  cc?: CommunicationParty[]
  attachments?: string[] // document IDs
  status: CommunicationStatus
  metadata?: CommunicationMetadata
  createdAt: Date
}

export enum CommunicationType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  SMS = 'SMS',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  LETTER = 'LETTER'
}

export interface CommunicationParty {
  type: 'USER' | 'CLIENT' | 'EXTERNAL'
  id?: string
  name: string
  email?: string
  phone?: string
}

export enum CommunicationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export interface CommunicationMetadata {
  duration?: number // for calls/videos in seconds
  recordingUrl?: string
  transcript?: string
  emailMessageId?: string
  phoneNumber?: string
}

// ============================================
// MARKETING AUTOMATION TYPES
// ============================================

export interface SEOAnalysis {
  id: string
  firmId: string
  url: string
  analysis: SEOMetrics
  competitors: Competitor[]
  recommendations: SEORecommendation[]
  keywords: KeywordAnalysis[]
  technicalIssues: TechnicalIssue[]
  createdAt: Date
}

export interface SEOMetrics {
  domainAuthority: number
  pageAuthority: number
  backlinks: number
  organicTraffic: number
  averagePosition: number
  clickThroughRate: number
  pageSpeed: PageSpeed
  mobileUsability: MobileUsability
}

export interface PageSpeed {
  score: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  totalBlockingTime: number
  cumulativeLayoutShift: number
}

export interface MobileUsability {
  score: number
  viewportConfigured: boolean
  textReadable: boolean
  touchTargetsSize: boolean
  issues: string[]
}

export interface Competitor {
  domain: string
  metrics: SEOMetrics
  topKeywords: string[]
  contentGap: string[]
}

export interface SEORecommendation {
  id: string
  type: 'TECHNICAL' | 'CONTENT' | 'BACKLINK' | 'LOCAL'
  priority: Priority
  title: string
  description: string
  impact: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'LOW' | 'MEDIUM' | 'HIGH'
  implemented: boolean
}

export interface KeywordAnalysis {
  keyword: string
  searchVolume: number
  difficulty: number
  currentRank?: number
  url?: string
  intent: SearchIntent
  trend: 'INCREASING' | 'STABLE' | 'DECREASING'
}

export enum SearchIntent {
  INFORMATIONAL = 'INFORMATIONAL',
  NAVIGATIONAL = 'NAVIGATIONAL',
  TRANSACTIONAL = 'TRANSACTIONAL',
  COMMERCIAL = 'COMMERCIAL'
}

export interface TechnicalIssue {
  id: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  affectedUrls: string[]
  solution: string
  resolved: boolean
}

export interface Campaign {
  id: string
  firmId: string
  name: string
  type: CampaignType
  status: CampaignStatus
  goals: CampaignGoal[]
  targetAudience: TargetAudience
  budget?: Budget
  channels: MarketingChannel[]
  content: CampaignContent[]
  schedule: CampaignSchedule
  performance: CampaignPerformance
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export enum CampaignType {
  EMAIL = 'EMAIL',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  PPC = 'PPC',
  CONTENT = 'CONTENT',
  MULTI_CHANNEL = 'MULTI_CHANNEL'
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface CampaignGoal {
  type: 'LEADS' | 'TRAFFIC' | 'CONVERSIONS' | 'BRAND_AWARENESS'
  target: number
  current: number
  deadline?: Date
}

export interface TargetAudience {
  demographics: Demographics
  interests: string[]
  behaviors: string[]
  customAudiences?: string[] // audience IDs
  excludeAudiences?: string[] // audience IDs
}

export interface Demographics {
  ageRange?: { min: number; max: number }
  gender?: 'ALL' | 'MALE' | 'FEMALE'
  locations?: Location[]
  languages?: string[]
  income?: { min: number; max: number }
}

export interface Location {
  type: 'COUNTRY' | 'STATE' | 'CITY' | 'ZIP' | 'RADIUS'
  value: string
  radius?: { value: number; unit: 'MILES' | 'KILOMETERS' }
}

export interface Budget {
  total: number
  spent: number
  daily?: number
  currency: string
  type: 'TOTAL' | 'DAILY' | 'LIFETIME'
}

export interface MarketingChannel {
  type: 'EMAIL' | 'FACEBOOK' | 'GOOGLE' | 'LINKEDIN' | 'TWITTER' | 'INSTAGRAM'
  enabled: boolean
  budget?: number
  settings: ChannelSettings
}

export interface ChannelSettings {
  // Dynamic based on channel type
  [key: string]: any
}

export interface CampaignContent {
  id: string
  type: 'EMAIL' | 'AD' | 'POST' | 'LANDING_PAGE'
  title: string
  content: string
  mediaUrls?: string[]
  cta?: CallToAction
  variations?: ContentVariation[] // for A/B testing
}

export interface CallToAction {
  text: string
  url: string
  type: 'BUTTON' | 'LINK' | 'FORM'
}

export interface ContentVariation {
  id: string
  name: string
  content: string
  weight: number // percentage
  performance?: VariationPerformance
}

export interface VariationPerformance {
  impressions: number
  clicks: number
  conversions: number
  conversionRate: number
}

export interface CampaignSchedule {
  startDate: Date
  endDate?: Date
  timezone: string
  sendTime?: string // HH:MM format
  frequency?: ScheduleFrequency
}

export interface ScheduleFrequency {
  type: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  daysOfWeek?: number[] // 0-6
  dayOfMonth?: number
}

export interface CampaignPerformance {
  impressions: number
  reach: number
  clicks: number
  conversions: number
  cost: number
  roi: number
  ctr: number // click-through rate
  cpc: number // cost per click
  cpa: number // cost per acquisition
}

export interface Lead {
  id: string
  firmId: string
  source: LeadSource
  status: LeadStatus
  score: number
  contactInfo: ContactInfo
  interests: string[]
  interactions: LeadInteraction[]
  assignedTo?: string
  convertedToClient?: string // client ID
  createdAt: Date
  updatedAt: Date
}

export interface LeadSource {
  type: 'WEBSITE' | 'CAMPAIGN' | 'REFERRAL' | 'SOCIAL' | 'ORGANIC' | 'PAID'
  campaign?: string
  medium?: string
  content?: string
  term?: string
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST'
}

export interface LeadInteraction {
  id: string
  type: 'EMAIL' | 'PHONE' | 'MEETING' | 'WEBSITE' | 'DOCUMENT'
  description: string
  outcome?: string
  nextAction?: string
  performedBy?: string
  timestamp: Date
}

// ============================================
// VIDEO AGENTS TYPES
// ============================================

export interface VideoSession {
  id: string
  firmId: string
  type: VideoSessionType
  status: VideoSessionStatus
  participants: Participant[]
  startTime?: Date
  endTime?: Date
  duration?: number // seconds
  recordingUrl?: string
  transcriptUrl?: string
  metadata: VideoSessionMetadata
  createdAt: Date
  updatedAt: Date
}

export enum VideoSessionType {
  RECEPTION = 'RECEPTION',
  INTAKE = 'INTAKE',
  CONSULTATION = 'CONSULTATION',
  DEPOSITION = 'DEPOSITION',
  CLIENT_MEETING = 'CLIENT_MEETING',
  INTERNAL_MEETING = 'INTERNAL_MEETING'
}

export enum VideoSessionStatus {
  SCHEDULED = 'SCHEDULED',
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface Participant {
  id: string
  type: 'USER' | 'CLIENT' | 'GUEST' | 'AI_AGENT'
  name: string
  email?: string
  role: string
  joinedAt?: Date
  leftAt?: Date
  deviceInfo?: DeviceInfo
}

export interface DeviceInfo {
  browser?: string
  os?: string
  ip?: string
  location?: string
}

export interface VideoSessionMetadata {
  purpose?: string
  caseId?: string
  clientId?: string
  notes?: string
  followUpRequired?: boolean
  followUpDate?: Date
  sentiment?: SentimentAnalysis
}

export interface Transcript {
  id: string
  sessionId: string
  content: TranscriptEntry[]
  summary: string
  keyPoints: string[]
  actionItems: ActionItem[]
  language: string
  duration: number
  wordCount: number
  speakerAnalysis: SpeakerAnalysis[]
  createdAt: Date
}

export interface TranscriptEntry {
  speaker: string
  speakerId: string
  text: string
  timestamp: number // seconds from start
  confidence: number
}

export interface ActionItem {
  id: string
  description: string
  assignedTo?: string
  dueDate?: Date
  priority: Priority
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  relatedTo?: string // case ID, client ID, etc.
}

export interface SpeakerAnalysis {
  speakerId: string
  speakerName: string
  talkTime: number // seconds
  talkPercentage: number
  sentimentScore: number
  interruptionCount: number
  averageResponseTime: number
}

export interface Appointment {
  id: string
  firmId: string
  type: AppointmentType
  title: string
  description?: string
  participantIds: string[]
  location: AppointmentLocation
  startTime: Date
  endTime: Date
  status: AppointmentStatus
  reminders: AppointmentReminder[]
  videoSessionId?: string
  recurrence?: RecurrenceRule
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export enum AppointmentType {
  CONSULTATION = 'CONSULTATION',
  COURT_HEARING = 'COURT_HEARING',
  DEPOSITION = 'DEPOSITION',
  CLIENT_MEETING = 'CLIENT_MEETING',
  INTERNAL_MEETING = 'INTERNAL_MEETING',
  DEADLINE = 'DEADLINE',
  OTHER = 'OTHER'
}

export interface AppointmentLocation {
  type: 'IN_PERSON' | 'VIDEO' | 'PHONE'
  address?: Address
  videoUrl?: string
  phoneNumber?: string
}

export enum AppointmentStatus {
  CONFIRMED = 'CONFIRMED',
  TENTATIVE = 'TENTATIVE',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  COMPLETED = 'COMPLETED'
}

export interface AppointmentReminder {
  id: string
  type: 'EMAIL' | 'SMS' | 'PUSH'
  timeBefore: number // minutes
  sent: boolean
  sentAt?: Date
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval: number
  count?: number
  until?: Date
  byDay?: string[] // MO, TU, WE, etc.
  byMonth?: number[]
  byMonthDay?: number[]
}

// ============================================
// COMMON API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: ResponseMetadata
}

export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
}

export interface ResponseMetadata {
  page?: number
  pageSize?: number
  totalPages?: number
  totalCount?: number
  hasMore?: boolean
  nextCursor?: string
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface FilterParams {
  search?: string
  startDate?: Date
  endDate?: Date
  status?: string
  tags?: string[]
  // Additional filters based on entity type
  [key: string]: any
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface Webhook {
  id: string
  firmId: string
  url: string
  events: WebhookEvent[]
  secret: string
  active: boolean
  headers?: Record<string, string>
  lastTriggered?: Date
  failureCount: number
  createdAt: Date
  updatedAt: Date
}

export enum WebhookEvent {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  
  // Client events
  CLIENT_CREATED = 'client.created',
  CLIENT_UPDATED = 'client.updated',
  CLIENT_CONVERTED = 'client.converted',
  
  // Case events
  CASE_CREATED = 'case.created',
  CASE_UPDATED = 'case.updated',
  CASE_CLOSED = 'case.closed',
  
  // Document events
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_ANALYZED = 'document.analyzed',
  
  // Communication events
  EMAIL_SENT = 'email.sent',
  EMAIL_RECEIVED = 'email.received',
  
  // Appointment events
  APPOINTMENT_SCHEDULED = 'appointment.scheduled',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  
  // Lead events
  LEAD_CREATED = 'lead.created',
  LEAD_CONVERTED = 'lead.converted',
  
  // Subscription events
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled'
}

export interface WebhookPayload {
  event: WebhookEvent
  firmId: string
  timestamp: Date
  data: any
  signature: string
}

// ============================================
// RATE LIMITING
// ============================================

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}