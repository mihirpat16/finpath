import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import {
  fetchEntries, addEntry, updateEntry, deleteEntry,
  fetchSnapshots, upsertCurrentMonthSnapshot,
} from '@/lib/supabase/netWorth'

function throwOnError(res) {
  if (res.error) throw res.error
  return res.data
}

export function useNetWorthEntries() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nw-entries', user?.id],
    queryFn: () => fetchEntries(user.id).then(throwOnError),
    enabled: !!user?.id,
  })
}

export function useNetWorthSnapshots() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nw-snapshots', user?.id],
    queryFn: () => fetchSnapshots(user.id).then(throwOnError),
    enabled: !!user?.id,
  })
}

export function useAddNetWorthEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entry) => addEntry(user.id, entry).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nw-entries', user?.id] }),
  })
}

export function useUpdateNetWorthEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }) => updateEntry(id, patch).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nw-entries', user?.id] }),
  })
}

export function useDeleteNetWorthEntry() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteEntry(id).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nw-entries', user?.id] }),
  })
}

export function useUpsertSnapshot() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (totals) => upsertCurrentMonthSnapshot(user.id, totals).then(throwOnError),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nw-snapshots', user?.id] }),
  })
}
