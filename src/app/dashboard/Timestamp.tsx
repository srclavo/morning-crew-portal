'use client'

export function Timestamp({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
  if (isToday) return <span>{time}</span>
  const day = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return <span>{day} · {time}</span>
}
