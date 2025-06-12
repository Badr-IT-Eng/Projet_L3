import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatDateTime(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })
}

export function truncate(str: string, length: number): string {
  if (!str || str.length <= length) return str
  return `${str.slice(0, length)}...`
}

export function getInitials(name: string): string {
  const parts = name.split(" ")
  let initials = ""
  parts.forEach(part => {
    if (part.length > 0) {
      initials += part[0].toUpperCase()
    }
  })
  return initials.slice(0, 2)
}
