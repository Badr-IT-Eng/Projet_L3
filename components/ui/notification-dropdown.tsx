"use client"

import * as React from "react"
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Info, ExternalLink } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Demo notifications data - Replace with real API integration
const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    type: "found" as const,
    title: "Your item has been found!",
    message: "Someone reported finding your lost wallet near the park.",
    time: "Just now",
    read: false,
    actionUrl: "/dashboard/items/1",
  },
  {
    id: 2,
    type: "message" as const,
    title: "New message from finder",
    message: "Hello, I found your keys at the library. Let's connect to return them.",
    time: "2 hours ago",
    read: false,
    actionUrl: "/messages/2",
  },
  {
    id: 3,
    type: "success" as const,
    title: "Verification completed",
    message: "Your item report has been verified and published.",
    time: "Yesterday",
    read: true,
    actionUrl: "/dashboard/items/3",
  },
  {
    id: 4,
    type: "info" as const,
    title: "Reminder",
    message: "Don't forget to update your contact information for better item recovery.",
    time: "3 days ago",
    read: true,
    actionUrl: "/profile/settings",
  },
]

type NotificationType = "found" | "message" | "success" | "info" | "warning"

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "found":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "message":
      return <MessageSquare className="h-4 w-4 text-blue-600" />
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "info":
    default:
      return <Info className="h-4 w-4 text-gray-600" />
  }
}

const getNotificationBadgeColor = (type: NotificationType) => {
  switch (type) {
    case "found":
      return "bg-green-100 text-green-800 border-green-200"
    case "message":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "success":
      return "bg-green-100 text-green-800 border-green-200"
    case "warning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "info":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [notifications, setNotifications] = React.useState(DEMO_NOTIFICATIONS)
  const [open, setOpen] = React.useState(false)
  
  const unreadCount = notifications.filter(notification => !notification.read).length

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({
        ...notification,
        read: true,
      }))
    )
  }

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const handleNotificationClick = (notification: typeof DEMO_NOTIFICATIONS[0]) => {
    markAsRead(notification.id)
    // In a real app, you would navigate to the action URL
    // router.push(notification.actionUrl)
    console.log(`Navigate to: ${notification.actionUrl}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("text-muted-foreground hover:bg-muted relative", className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary"></span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">Notifications</h3>
            <Badge variant="outline" className="text-xs">
              Demo Data
            </Badge>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="grid gap-1 p-1">
              {notifications.map(notification => (
                <button
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-2 rounded-md p-3 text-left text-sm transition-colors hover:bg-muted group",
                    !notification.read && "bg-muted/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <div className="font-medium">{notification.title}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {notification.time}
                      </div>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {notification.message}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs h-5", getNotificationBadgeColor(notification.type))}
                    >
                      {notification.type}
                    </Badge>
                    {!notification.read && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
            <p className="text-xs mt-1">We'll notify you when something happens</p>
          </div>
        )}
        <div className="border-t p-2">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <ExternalLink className="h-3 w-3" />
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
} 