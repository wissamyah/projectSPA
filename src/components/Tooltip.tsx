import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './Tooltip.css'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
  delay = 200,
  className = ''
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({})
  const [isMounted, setIsMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    
    let top = 0
    let left = 0
    
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + 8
        break
    }
    
    // Ensure tooltip stays within viewport
    const padding = 10
    if (left < padding) left = padding
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding
    }
    if (top < padding) top = padding
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding
    }
    
    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
      pointerEvents: 'none' as const,
      opacity: 1,
      visibility: 'visible'
    })
  }, [position])

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      setIsMounted(false) // Reset mounted state for new hover
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
    setIsMounted(false)
  }

  // Use callback ref to know exactly when tooltip is mounted
  const tooltipCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      tooltipRef.current = node
      // Use requestAnimationFrame to ensure the browser has painted the element
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          calculatePosition()
          setIsMounted(true)
        })
      })
    }
  }, [calculatePosition])

  useEffect(() => {
    if (isVisible && isMounted) {
      // Recalculate on scroll or resize
      const handleRecalculate = () => calculatePosition()
      window.addEventListener('scroll', handleRecalculate, true)
      window.addEventListener('resize', handleRecalculate)
      
      return () => {
        window.removeEventListener('scroll', handleRecalculate, true)
        window.removeEventListener('resize', handleRecalculate)
      }
    }
  }, [isVisible, isMounted, calculatePosition])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2'
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2'
      case 'left':
        return 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2'
      case 'right':
        return 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2'
      default:
        return ''
    }
  }

  // Initial style for tooltip (invisible but measurable)
  const initialStyle: React.CSSProperties = {
    position: 'fixed',
    top: '0px',
    left: '0px',
    visibility: 'hidden',
    opacity: 0,
    zIndex: 9999,
    pointerEvents: 'none'
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div
          ref={tooltipCallbackRef}
          style={isMounted ? tooltipStyle : initialStyle}
          className={`
            tooltip-container bg-slate-800 text-white text-sm rounded-lg px-4 py-3
            shadow-xl min-w-max max-w-sm transition-opacity duration-200
            ${className}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-slate-800 rotate-45 ${getArrowStyles()}`}
          />
        </div>,
        document.body
      )}
    </>
  )
}

export default Tooltip