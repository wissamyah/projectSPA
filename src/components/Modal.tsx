import { useEffect, useState } from 'react'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  showCloseButton?: boolean
  className?: string
}

const Modal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  showCloseButton = true,
  className = ''
}: ModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsLoading(true)
      try {
        await onConfirm()
        handleClose()
      } catch (error) {
        console.error('Modal action error:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      handleClose()
    }
  }

  if (!isOpen && !isClosing) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-500" />
      case 'confirm':
        return <AlertTriangle className="h-6 w-6 text-blue-500" />
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  const getButtonColors = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      case 'confirm':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
      default:
        return 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto transform transition-all duration-200 ${
            isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          } ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
              <div className="flex-1">
                {title && (
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {title}
                  </h3>
                )}
                <p className="text-slate-600 whitespace-pre-line">{message}</p>
              </div>
            </div>
            {showCloseButton && type !== 'confirm' && (
              <button
                onClick={handleClose}
                className="ml-4 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            {type === 'confirm' && (
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${getButtonColors()}`}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Modal