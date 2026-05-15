import { useQuery } from '@tanstack/react-query'
import { getPrices } from '@/lib/market-data/cache'

/**
 * Fetches live prices for a list of tickers using the Supabase 15-min cache.
 * Returns a Map<ticker, priceRow> with current_price, last_updated, stale, fetch_error.
 */
export function usePrices(tickers = []) {
  const unique = [...new Set(tickers.filter(Boolean))].sort()
  const cacheKey = unique.join(',')

  const query = useQuery({
    queryKey: ['prices', cacheKey],
    queryFn: () => getPrices(unique),
    enabled: unique.length > 0,
    staleTime: 14 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    select: (rows) => new Map(rows.map(r => [r.ticker, r])),
  })

  return {
    priceMap: query.data ?? new Map(),
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  }
}
