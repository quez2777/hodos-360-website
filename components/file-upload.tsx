'use client'

import React, { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, AlertCircle, CheckCircle, XCircle, Loader2, Shield, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import axios from 'axios'

interface FileUploadProps {
  onUploadComplete?: (documentId: string, url: string) => void
  onError?: (error: string) => void
  maxSize?: number // in bytes
  acceptedTypes?: string[]
  caseId?: string
  clientId?: string
  tags?: string[]
  encrypt?: boolean
  multiple?: boolean
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'scanning' | 'success' | 'error'
  error?: string
  documentId?: string
  url?: string
  virusScanStatus?: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  maxSize = 100 * 1024 * 1024, // 100MB default
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
  ],
  caseId,
  clientId,
  tags,
  encrypt = false,
  multiple = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxSize)}`,
      }
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not allowed',
      }
    }

    return { valid: true }
  }

  const uploadFile = async (file: File, fileId: string) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error' as const, error: validation.error }
            : f
        )
      )
      onError?.(validation.error || 'Validation failed')
      return
    }

    try {
      // Update status to uploading
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId ? { ...f, status: 'uploading' as const } : f
        )
      )

      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'metadata',
        JSON.stringify({
          caseId,
          clientId,
          tags,
          encrypt,
          scanForVirus: true,
        })
      )

      // Upload file
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadingFiles(prev =>
              prev.map(f =>
                f.id === fileId ? { ...f, progress } : f
              )
            )
          }
        },
      })

      // Update status to scanning if virus scan is pending
      if (response.data.virusScanResult) {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'success' as const,
                  documentId: response.data.documentId,
                  url: response.data.url,
                  virusScanStatus: response.data.virusScanResult.clean ? 'clean' : 'infected',
                }
              : f
          )
        )
      } else {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.id === fileId
              ? {
                  ...f,
                  status: 'scanning' as const,
                  documentId: response.data.documentId,
                  url: response.data.url,
                }
              : f
          )
        )

        // Simulate scan completion after a delay
        setTimeout(() => {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.id === fileId
                ? { ...f, status: 'success' as const, virusScanStatus: 'clean' }
                : f
            )
          )
        }, 2000)
      }

      onUploadComplete?.(response.data.documentId, response.data.url)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : 'Upload failed'

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      )
      onError?.(errorMessage)
    }
  }

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return

      const filesToUpload = multiple ? Array.from(files) : [files[0]]
      const newFiles: UploadingFile[] = filesToUpload.map(file => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: 'pending' as const,
      }))

      setUploadingFiles(prev => [...prev, ...newFiles])

      // Start uploading each file
      newFiles.forEach(({ file, id }) => {
        uploadFile(file, id)
      })
    },
    [multiple]
  )

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounter.current = 0

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const getStatusIcon = (file: UploadingFile) => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'scanning':
        return <Shield className="h-4 w-4 animate-pulse text-yellow-500" />
      case 'success':
        return file.virusScanStatus === 'clean' ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = (file: UploadingFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress}%`
      case 'scanning':
        return 'Scanning for viruses...'
      case 'success':
        return file.virusScanStatus === 'clean' ? 'Upload complete' : 'Virus detected!'
      case 'error':
        return file.error || 'Upload failed'
      default:
        return 'Waiting...'
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-700',
          'hover:border-gray-400 dark:hover:border-gray-600'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center justify-center p-8">
          <motion.div
            animate={{
              scale: isDragging ? 1.1 : 1,
              rotate: isDragging ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Upload className="h-12 w-12 text-gray-400" />
          </motion.div>
          <p className="mt-4 text-sm font-medium text-gray-700 dark:text-gray-300">
            Drop files here or click to upload
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {acceptedTypes.length > 0 && (
              <>Accepted: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG</>
            )}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max size: {formatFileSize(maxSize)}
          </p>
          {encrypt && (
            <Badge variant="secondary" className="mt-2">
              <Lock className="mr-1 h-3 w-3" />
              Files will be encrypted
            </Badge>
          )}
        </div>
      </div>

      <AnimatePresence>
        {uploadingFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 space-y-2"
          >
            {uploadingFiles.map(file => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file.file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.file.size)} • {getStatusText(file)}
                      </p>
                    </div>
                  </div>
                  {(file.status === 'success' || file.status === 'error') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="mt-2 h-1" />
                )}
                {file.status === 'error' && file.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{file.error}</AlertDescription>
                  </Alert>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload