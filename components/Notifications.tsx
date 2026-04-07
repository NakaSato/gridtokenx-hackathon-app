import { InfoIcon, NotificationIcon, RedCircle } from '@/public/svgs/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useEffect, useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { XIcon, BellOff, CheckCheck, Loader2, Settings2, Bell } from 'lucide-react'
import { Separator } from './ui/separator'
import { useAuth } from '@/contexts/AuthProvider'
import { createApiClient } from '@/lib/api-client'
import type { Notification } from '@/types/features'
import { formatDistanceToNow } from 'date-fns'
import NotificationPreferences from './NotificationPreferences'
import { cn } from '@/lib/utils'

export default function Notifications() {
  const { token, isAuthenticated } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [view, setView] = useState<'list' | 'settings'>('list')

  const fetchNotifications = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const apiClient = createApiClient(token)
      const data = await apiClient.listNotifications({ limit: 20 })
      if (data && data.data) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unread_count)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, fetchNotifications])

  const markAsRead = async (id: string) => {
    if (!token) return
    try {
      const apiClient = createApiClient(token)
      await apiClient.markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return
    try {
      const apiClient = createApiClient(token)
      await apiClient.markAllNotificationsAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const NotificationItem = ({ item, isMobile = false }: { item: Notification, isMobile?: boolean }) => (
    <div className={cn("w-full p-4 transition-colors hover:bg-secondary/30", !item.is_read && "bg-primary/5")}>
      <div className="flex w-full space-x-3">
        <div className={cn(
          "h-fit rounded-sm p-[9px]",
          item.is_read ? "bg-secondary text-secondary-foreground" : "bg-primary/20 text-primary"
        )}>
          <InfoIcon />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-normal text-foreground leading-relaxed">
            {item.message}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-secondary-foreground opacity-70">
              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
            </span>
            {!item.is_read && (
              <button
                onClick={() => markAsRead(item.id)}
                className="text-[10px] text-primary hover:underline font-medium"
              >
                Mark read
              </button>
            )}
          </div>
        </div>
        {!item.is_read && (
          <div className="pt-1">
            <RedCircle />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <DropdownMenu onOpenChange={(open) => !open && setView('list')}>
        <DropdownMenuTrigger className="hidden focus:outline-none sm:flex relative">
          <div className="rounded-sm bg-secondary p-[9px] text-foreground hover:text-primary transition-all">
            <NotificationIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="flex w-[350px] flex-col rounded-sm bg-accent p-0 shadow-2xl border border-border"
        >
          <div className="flex items-center justify-between w-full px-4 py-3 border-b border-border/50">
            <span className="text-xs font-semibold text-foreground flex items-center gap-2">
              {view === 'list' ? (
                <>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </>
              ) : (
                <>
                  <Settings2 size={12} />
                  Preferences
                </>
              )}
            </span>
            <div className="flex items-center gap-1">
              {view === 'list' ? (
                <>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-primary hover:text-primary/80 hover:bg-primary/5 gap-1 px-2"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck size={12} />
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={() => setView('settings')}
                  >
                    <Settings2 size={14} />
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] text-primary hover:text-primary/80"
                  onClick={() => setView('list')}
                >
                  Back
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-3">
            {view === 'list' ? (
              <>
                {loading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 opacity-50">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs">Loading alerts...</span>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="-m-3">
                    {notifications.map((n) => (
                      <div key={n.id}>
                        <NotificationItem item={n} />
                        <Separator className="opacity-30" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 opacity-50">
                    <BellOff className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs">No notifications yet</span>
                  </div>
                )}
              </>
            ) : (
              <NotificationPreferences />
            )}
          </div>
          {view === 'list' && notifications.length > 0 && (
            <div className="p-2 border-t border-border/50">
              <Button variant="ghost" className="w-full h-8 text-xs text-secondary-foreground hover:text-foreground">
                View All Activity
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger className="focus:outline-none sm:hidden relative">
          <div className="rounded-[12px] bg-secondary p-[9px] text-foreground hover:text-primary">
            <NotificationIcon />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="flex h-full w-full flex-col gap-0 border-none bg-accent p-0 outline-none">
          <div className="flex w-full items-center justify-between px-4 py-3 border-b border-border">
            <DialogTitle className="text-base font-medium text-foreground">
              Notifications
            </DialogTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <CheckCheck size={16} />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="w-9 h-9 p-0"
                onClick={() => setIsOpen(false)}
              >
                <XIcon size={18} className="text-secondary-foreground" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id}>
                  <NotificationItem item={n} isMobile />
                  <Separator className="opacity-50" />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                <BellOff size={48} className="text-muted-foreground" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

