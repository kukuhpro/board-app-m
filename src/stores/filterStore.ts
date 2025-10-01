import { create } from 'zustand'
import { JobType } from '@/domain/valueObjects/JobType'

interface JobFilters {
  location: string
  jobType: JobType | null
  searchTerm: string
  page: number
  limit: number
  orderBy: 'createdAt' | 'updatedAt' | 'title' | 'company'
  orderDirection: 'asc' | 'desc'
}

interface FilterState {
  // Filter state
  filters: JobFilters

  // Pagination metadata
  totalJobs: number
  hasMore: boolean

  // Loading state
  isLoading: boolean

  // Actions
  setFilters: (filters: Partial<JobFilters>) => void
  updateFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => void
  clearFilters: () => void
  resetPagination: () => void
  setPage: (page: number) => void
  setLoading: (loading: boolean) => void
  setPaginationMeta: (total: number, hasMore: boolean) => void

  // Computed getters
  getActiveFiltersCount: () => number
  hasActiveFilters: () => boolean
  getQueryParams: () => Record<string, string>
}

const defaultFilters: JobFilters = {
  location: '',
  jobType: null,
  searchTerm: '',
  page: 1,
  limit: 20,
  orderBy: 'createdAt',
  orderDirection: 'desc'
}

export const useFilterStore = create<FilterState>((set, get) => ({
  // Initial state
  filters: { ...defaultFilters },
  totalJobs: 0,
  hasMore: false,
  isLoading: false,

  // Actions
  setFilters: (newFilters: Partial<JobFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 }, // Reset to page 1 when filters change
      hasMore: false,
      totalJobs: 0
    }))
  },

  updateFilter: <K extends keyof JobFilters>(key: K, value: JobFilters[K]) => {
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value,
        // Reset pagination when any filter except page changes
        ...(key !== 'page' ? { page: 1 } : {})
      },
      // Reset pagination metadata when filters change
      ...(key !== 'page' ? { hasMore: false, totalJobs: 0 } : {})
    }))
  },

  clearFilters: () => {
    set({
      filters: { ...defaultFilters },
      totalJobs: 0,
      hasMore: false
    })
  },

  resetPagination: () => {
    set((state) => ({
      filters: { ...state.filters, page: 1 },
      totalJobs: 0,
      hasMore: false
    }))
  },

  setPage: (page: number) => {
    set((state) => ({
      filters: { ...state.filters, page }
    }))
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setPaginationMeta: (total: number, hasMore: boolean) => {
    set({ totalJobs: total, hasMore })
  },

  // Computed getters
  getActiveFiltersCount: () => {
    const { filters } = get()
    let count = 0

    if (filters.location.trim()) count++
    if (filters.jobType) count++
    if (filters.searchTerm.trim()) count++

    return count
  },

  hasActiveFilters: () => {
    return get().getActiveFiltersCount() > 0
  },

  getQueryParams: () => {
    const { filters } = get()
    const params: Record<string, string> = {}

    if (filters.location.trim()) params.location = filters.location
    if (filters.jobType) params.jobType = filters.jobType
    if (filters.searchTerm.trim()) params.search = filters.searchTerm
    if (filters.page > 1) params.page = filters.page.toString()
    if (filters.limit !== 20) params.limit = filters.limit.toString()
    if (filters.orderBy !== 'createdAt') params.orderBy = filters.orderBy
    if (filters.orderDirection !== 'desc') params.orderDirection = filters.orderDirection

    return params
  }
}))

// Selectors for convenience
export const useJobFilters = () => useFilterStore((state) => state.filters)
export const useFilterLoading = () => useFilterStore((state) => state.isLoading)
export const usePaginationMeta = () => {
  const totalJobs = useFilterStore((state) => state.totalJobs)
  const hasMore = useFilterStore((state) => state.hasMore)
  const currentPage = useFilterStore((state) => state.filters.page)
  const limit = useFilterStore((state) => state.filters.limit)

  return { totalJobs, hasMore, currentPage, limit }
}

// Filter actions
export const useFilterActions = () => ({
  setFilters: useFilterStore((state) => state.setFilters),
  updateFilter: useFilterStore((state) => state.updateFilter),
  clearFilters: useFilterStore((state) => state.clearFilters),
  resetPagination: useFilterStore((state) => state.resetPagination),
  setPage: useFilterStore((state) => state.setPage),
  setLoading: useFilterStore((state) => state.setLoading),
  setPaginationMeta: useFilterStore((state) => state.setPaginationMeta)
})

// Computed selectors
export const useActiveFiltersCount = () => useFilterStore((state) => state.getActiveFiltersCount())
export const useHasActiveFilters = () => useFilterStore((state) => state.hasActiveFilters())
export const useQueryParams = () => useFilterStore((state) => state.getQueryParams())