'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  CalendarIcon, 
  ArrowLeftIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface CalendarEntry {
  id: string
  title: string
  scheduledDate: string
  postType: 'blog' | 'social' | 'email'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  category: string
  keywords: string[]
  assignedTo?: string
  notes?: string
  createdAt: string
}

interface BlogPost {
  id: string
  title: string
  scheduledFor: string
  status: 'scheduled'
  categories: Array<{
    name: string
    color: string
  }>
}

const CATEGORIES = [
  { id: 'ai-law-firm-management', name: 'AI Law Firm Management', color: '#3B82F6' },
  { id: 'legal-marketing-automation', name: 'Legal Marketing Automation', color: '#10B981' },
  { id: 'ai-video-for-law-firms', name: 'AI Video for Law Firms', color: '#8B5CF6' },
  { id: 'legal-tech-trends', name: 'Legal Tech Trends', color: '#F59E0B' },
  { id: 'law-firm-growth', name: 'Law Firm Growth', color: '#EF4444' }
]

const POST_TYPES = [
  { value: 'blog', label: 'Blog Post', color: '#3B82F6' },
  { value: 'social', label: 'Social Media', color: '#10B981' },
  { value: 'email', label: 'Newsletter', color: '#8B5CF6' }
]

const STATUS_COLORS = {
  planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
}

export default function ContentCalendar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<BlogPost[]>([])
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    scheduledDate: '',
    postType: 'blog' as 'blog' | 'social' | 'email',
    category: '',
    keywords: '',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchCalendarData()
    fetchScheduledPosts()
  }, [session, status, currentDate])

  const fetchCalendarData = async () => {
    try {
      // Mock calendar entries for now - would integrate with actual API
      const mockEntries: CalendarEntry[] = [
        {
          id: '1',
          title: 'AI Contract Review Best Practices',
          scheduledDate: '2024-01-15',
          postType: 'blog',
          status: 'planned',
          category: 'ai-law-firm-management',
          keywords: ['AI contract review', 'legal automation', 'contract analysis'],
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          title: 'Social Media: New AI Features Launch',
          scheduledDate: '2024-01-18',
          postType: 'social',
          status: 'in_progress',
          category: 'legal-marketing-automation',
          keywords: ['social media', 'AI launch', 'legal marketing'],
          createdAt: '2024-01-02'
        }
      ]
      
      setCalendarEntries(mockEntries)
    } catch (error) {
      console.error('Failed to fetch calendar data:', error)
    }
  }

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('/api/blog?status=scheduled')
      const data = await response.json()
      
      if (response.ok) {
        setScheduledPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEntry = async () => {
    if (!formData.title || !formData.scheduledDate || !formData.category) {
      return
    }

    const newEntry: CalendarEntry = {
      id: Date.now().toString(),
      title: formData.title,
      scheduledDate: formData.scheduledDate,
      postType: formData.postType,
      status: 'planned',
      category: formData.category,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
      notes: formData.notes,
      createdAt: new Date().toISOString()
    }

    setCalendarEntries([...calendarEntries, newEntry])
    setShowNewEntryForm(false)
    setFormData({
      title: '',
      scheduledDate: '',
      postType: 'blog',
      category: '',
      keywords: '',
      notes: ''
    })
  }

  const deleteEntry = (id: string) => {
    if (confirm('Are you sure you want to delete this calendar entry?')) {
      setCalendarEntries(calendarEntries.filter(e => e.id !== id))
    }
  }

  const updateEntryStatus = (id: string, status: CalendarEntry['status']) => {
    setCalendarEntries(calendarEntries.map(entry => 
      entry.id === id ? { ...entry, status } : entry
    ))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEntriesForDate = (date: Date | null) => {
    if (!date) return []
    
    const dateStr = date.toISOString().split('T')[0]
    const entries = calendarEntries.filter(entry => 
      entry.scheduledDate === dateStr
    )
    const posts = scheduledPosts.filter(post => 
      post.scheduledFor?.split('T')[0] === dateStr
    )
    
    return [...entries, ...posts.map(post => ({
      id: post.id,
      title: post.title,
      scheduledDate: post.scheduledFor.split('T')[0],
      postType: 'blog' as const,
      status: 'scheduled' as const,
      category: post.categories[0]?.name || '',
      keywords: [],
      createdAt: post.scheduledFor
    }))]
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'scheduled':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
      default:
        return <ClockIcon className="h-4 w-4 text-blue-500" />
    }
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const days = getDaysInMonth(currentDate)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/admin/blog">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Content Calendar</GradientText>
            </h1>
            <p className="text-muted-foreground">
              Plan and schedule your content for maximum impact
            </p>
          </div>
          <Button onClick={() => setShowNewEntryForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="text-2xl">
              {calendarEntries.filter(e => 
                new Date(e.scheduledDate).getMonth() === currentDate.getMonth()
              ).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled Posts</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{scheduledPosts.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {calendarEntries.filter(e => e.status === 'in_progress').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {calendarEntries.filter(e => e.status === 'completed').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                  const entries = getEntriesForDate(day)
                  const isToday = day && 
                    day.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border rounded-lg relative ${
                        day ? 'bg-background hover:bg-muted/50' : 'bg-muted/20'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium mb-2 ${
                            isToday ? 'text-primary' : 'text-foreground'
                          }`}>
                            {day.getDate()}
                          </div>
                          
                          <div className="space-y-1">
                            {entries.slice(0, 2).map((entry, entryIndex) => (
                              <div
                                key={entryIndex}
                                className={`text-xs p-1 rounded truncate ${
                                  entry.postType === 'blog' ? 'bg-blue-100 text-blue-800' :
                                  entry.postType === 'social' ? 'bg-green-100 text-green-800' :
                                  'bg-purple-100 text-purple-800'
                                }`}
                                title={entry.title}
                              >
                                {entry.title}
                              </div>
                            ))}
                            
                            {entries.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{entries.length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* New Entry Form */}
          {showNewEntryForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add Content</CardTitle>
                <CardDescription>Schedule new content for your calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter content title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Scheduled Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Content Type</Label>
                  <Select 
                    value={formData.postType} 
                    onValueChange={(value: any) => setFormData({...formData, postType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({...formData, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateEntry} className="flex-1">
                    Add to Calendar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewEntryForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Content */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Content</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {calendarEntries
                .filter(entry => {
                  const entryDate = new Date(entry.scheduledDate)
                  const today = new Date()
                  const weekFromNow = new Date()
                  weekFromNow.setDate(today.getDate() + 7)
                  return entryDate >= today && entryDate <= weekFromNow
                })
                .slice(0, 5)
                .map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(entry.status)}
                        <span className="font-medium text-sm">{entry.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(entry.scheduledDate).toLocaleDateString()}
                        <Badge variant="outline" className="text-xs">
                          {entry.postType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteEntry(entry.id)}>
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              }
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}