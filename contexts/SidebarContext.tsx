'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface SidebarContextType {
  showLeftSidebar: boolean
  showRightSidebar: boolean
  showPositionsPanel: boolean
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  togglePositionsPanel: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [showPositionsPanel, setShowPositionsPanel] = useState(true)

  const toggleLeftSidebar = useCallback(() => {
    setShowLeftSidebar((prev) => !prev)
  }, [])

  const toggleRightSidebar = useCallback(() => {
    setShowRightSidebar((prev) => !prev)
  }, [])

  const togglePositionsPanel = useCallback(() => {
    setShowPositionsPanel((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        showLeftSidebar,
        showRightSidebar,
        showPositionsPanel,
        toggleLeftSidebar,
        toggleRightSidebar,
        togglePositionsPanel,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
