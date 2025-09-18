import { createContext, useContext, useState, ReactNode } from 'react'
import Modal, { ModalProps } from '../components/Modal'

interface ModalOptions {
  title?: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm'
  confirmText?: string
  cancelText?: string
}

interface ModalContextType {
  showModal: (options: ModalOptions) => Promise<boolean>
  showAlert: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>
  showConfirm: (message: string, title?: string) => Promise<boolean>
  hideModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModal = () => {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: ReactNode
}

export const ModalProvider = ({ children }: ModalProviderProps) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    options: ModalOptions
    resolver?: (value: boolean) => void
  }>({
    isOpen: false,
    options: { message: '' }
  })

  const showModal = (options: ModalOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolver: resolve
      })
    })
  }

  const showAlert = (
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          message,
          type,
          confirmText: 'OK'
        },
        resolver: () => resolve()
      })
    })
  }

  const showConfirm = (message: string, title?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options: {
          title,
          message,
          type: 'confirm',
          confirmText: 'Confirm',
          cancelText: 'Cancel'
        },
        resolver: resolve
      })
    })
  }

  const hideModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false
    }))
  }

  const handleClose = () => {
    if (modalState.resolver) {
      modalState.resolver(false)
    }
    hideModal()
  }

  const handleConfirm = () => {
    if (modalState.resolver) {
      modalState.resolver(true)
    }
    hideModal()
  }

  return (
    <ModalContext.Provider value={{ showModal, showAlert, showConfirm, hideModal }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={handleClose}
        onConfirm={modalState.options.type === 'confirm' ? handleConfirm : handleClose}
        {...modalState.options}
      />
    </ModalContext.Provider>
  )
}