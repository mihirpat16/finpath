/**
 * NSE India market hours: 9:15 AM – 3:30 PM IST
 * IST = UTC+5:30, so in UTC: 3:45 – 10:00
 */
export function isNSEMarketOpen(date = new Date()) {
  const day = date.getUTCDay()
  if (day === 0 || day === 6) return false // Weekend

  const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes()
  // NSE: 9:15 IST = 3:45 UTC | 3:30 PM IST = 10:00 UTC
  return utcMinutes >= 3 * 60 + 45 && utcMinutes <= 10 * 60
}

export function marketStatusLabel() {
  return isNSEMarketOpen() ? '🟢 NSE Open' : '🔴 NSE Closed'
}

export function marketStatusColor() {
  return isNSEMarketOpen() ? 'text-growth' : 'text-muted-foreground'
}

export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'never'
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
}
