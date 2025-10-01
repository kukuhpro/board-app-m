import { renderHook, act } from '@testing-library/react'
import {
  useFilterStore,
  useJobFilters,
  useFilterLoading,
  usePaginationMeta,
  useFilterActions,
  useActiveFiltersCount,
  useHasActiveFilters,
  useQueryParams
} from '@/stores/filterStore'
import { JobType } from '@/domain/valueObjects/JobType'

describe('filterStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useFilterStore.setState({
      filters: {
        location: '',
        jobType: null,
        searchTerm: '',
        page: 1,
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      },
      totalJobs: 0,
      hasMore: false,
      isLoading: false
    })
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useFilterStore())

      expect(result.current.filters).toEqual({
        location: '',
        jobType: null,
        searchTerm: '',
        page: 1,
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      })
      expect(result.current.totalJobs).toBe(0)
      expect(result.current.hasMore).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('setFilters action', () => {
    it('should update filters and reset pagination', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.setFilters({
          location: 'New York',
          jobType: JobType.FULL_TIME,
          searchTerm: 'developer'
        })
      })

      expect(result.current.filters.location).toBe('New York')
      expect(result.current.filters.jobType).toBe(JobType.FULL_TIME)
      expect(result.current.filters.searchTerm).toBe('developer')
      expect(result.current.filters.page).toBe(1) // Should reset to page 1
      expect(result.current.totalJobs).toBe(0)
      expect(result.current.hasMore).toBe(false)
    })

    it('should preserve other filter values when partially updating', () => {
      const { result } = renderHook(() => useFilterStore())

      // First set some filters
      act(() => {
        result.current.setFilters({
          location: 'New York',
          jobType: JobType.FULL_TIME,
          limit: 10
        })
      })

      // Then update only location
      act(() => {
        result.current.setFilters({
          location: 'San Francisco'
        })
      })

      expect(result.current.filters.location).toBe('San Francisco')
      expect(result.current.filters.jobType).toBe(JobType.FULL_TIME) // Should be preserved
      expect(result.current.filters.limit).toBe(10) // Should be preserved
    })
  })

  describe('updateFilter action', () => {
    it('should update individual filter and reset pagination', () => {
      const { result } = renderHook(() => useFilterStore())

      // Set page to 3 first
      act(() => {
        result.current.updateFilter('page', 3)
      })

      expect(result.current.filters.page).toBe(3)

      // Then update location (should reset page)
      act(() => {
        result.current.updateFilter('location', 'New York')
      })

      expect(result.current.filters.location).toBe('New York')
      expect(result.current.filters.page).toBe(1) // Should reset to page 1
    })

    it('should not reset pagination when updating page', () => {
      const { result } = renderHook(() => useFilterStore())

      // Set some pagination meta
      act(() => {
        result.current.setPaginationMeta(100, true)
      })

      // Update page
      act(() => {
        result.current.updateFilter('page', 3)
      })

      expect(result.current.filters.page).toBe(3)
      expect(result.current.totalJobs).toBe(100) // Should be preserved
      expect(result.current.hasMore).toBe(true) // Should be preserved
    })

    it('should update jobType filter', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.updateFilter('jobType', JobType.REMOTE)
      })

      expect(result.current.filters.jobType).toBe(JobType.REMOTE)
    })

    it('should update orderBy and orderDirection', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.updateFilter('orderBy', 'title')
      })

      expect(result.current.filters.orderBy).toBe('title')

      act(() => {
        result.current.updateFilter('orderDirection', 'asc')
      })

      expect(result.current.filters.orderDirection).toBe('asc')
    })
  })

  describe('clearFilters action', () => {
    it('should reset all filters to defaults', () => {
      const { result } = renderHook(() => useFilterStore())

      // First set some filters
      act(() => {
        result.current.setFilters({
          location: 'New York',
          jobType: JobType.FULL_TIME,
          searchTerm: 'developer',
          page: 3,
          limit: 10,
          orderBy: 'title',
          orderDirection: 'asc'
        })
        result.current.setPaginationMeta(100, true)
      })

      // Then clear all filters
      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.filters).toEqual({
        location: '',
        jobType: null,
        searchTerm: '',
        page: 1,
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      })
      expect(result.current.totalJobs).toBe(0)
      expect(result.current.hasMore).toBe(false)
    })
  })

  describe('pagination actions', () => {
    it('should reset pagination', () => {
      const { result } = renderHook(() => useFilterStore())

      // Set page and pagination meta
      act(() => {
        result.current.updateFilter('page', 5)
        result.current.setPaginationMeta(100, true)
      })

      act(() => {
        result.current.resetPagination()
      })

      expect(result.current.filters.page).toBe(1)
      expect(result.current.totalJobs).toBe(0)
      expect(result.current.hasMore).toBe(false)
    })

    it('should set page', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.setPage(5)
      })

      expect(result.current.filters.page).toBe(5)
    })

    it('should set pagination metadata', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.setPaginationMeta(150, true)
      })

      expect(result.current.totalJobs).toBe(150)
      expect(result.current.hasMore).toBe(true)
    })
  })

  describe('loading state', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useFilterStore())

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.isLoading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('computed getters', () => {
    it('should count active filters correctly', () => {
      const { result } = renderHook(() => useFilterStore())

      // No active filters initially
      expect(result.current.getActiveFiltersCount()).toBe(0)

      // Add location filter
      act(() => {
        result.current.updateFilter('location', 'New York')
      })

      expect(result.current.getActiveFiltersCount()).toBe(1)

      // Add job type filter
      act(() => {
        result.current.updateFilter('jobType', JobType.FULL_TIME)
      })

      expect(result.current.getActiveFiltersCount()).toBe(2)

      // Add search term
      act(() => {
        result.current.updateFilter('searchTerm', 'developer')
      })

      expect(result.current.getActiveFiltersCount()).toBe(3)

      // Empty search term should not count
      act(() => {
        result.current.updateFilter('searchTerm', '   ')
      })

      expect(result.current.getActiveFiltersCount()).toBe(2)
    })

    it('should determine if has active filters', () => {
      const { result } = renderHook(() => useFilterStore())

      expect(result.current.hasActiveFilters()).toBe(false)

      act(() => {
        result.current.updateFilter('location', 'New York')
      })

      expect(result.current.hasActiveFilters()).toBe(true)

      act(() => {
        result.current.clearFilters()
      })

      expect(result.current.hasActiveFilters()).toBe(false)
    })

    it('should generate query params correctly', () => {
      const { result } = renderHook(() => useFilterStore())

      // Empty filters should return empty params
      expect(result.current.getQueryParams()).toEqual({})

      // Set some filters
      act(() => {
        result.current.setFilters({
          location: 'New York',
          jobType: JobType.FULL_TIME,
          searchTerm: 'developer',
          limit: 10,
          orderBy: 'title',
          orderDirection: 'asc'
        })
      })

      // Then set page separately (setFilters resets page to 1)
      act(() => {
        result.current.setPage(2)
      })

      expect(result.current.getQueryParams()).toEqual({
        location: 'New York',
        jobType: 'Full-Time',
        search: 'developer',
        page: '2',
        limit: '10',
        orderBy: 'title',
        orderDirection: 'asc'
      })

      // Default values should not be included
      act(() => {
        result.current.clearFilters()
        result.current.updateFilter('location', 'San Francisco')
      })

      expect(result.current.getQueryParams()).toEqual({
        location: 'San Francisco'
      })
    })
  })

  describe('selectors', () => {
    it('should provide job filters selector', () => {
      const { result: filtersResult } = renderHook(() => useJobFilters())
      const { result: storeResult } = renderHook(() => useFilterStore())

      act(() => {
        storeResult.current.updateFilter('location', 'New York')
      })

      expect(filtersResult.current.location).toBe('New York')
    })

    it('should provide filter loading selector', () => {
      const { result: loadingResult } = renderHook(() => useFilterLoading())
      const { result: storeResult } = renderHook(() => useFilterStore())

      act(() => {
        storeResult.current.setLoading(true)
      })

      expect(loadingResult.current).toBe(true)
    })

    it('should provide pagination meta selector', () => {
      const { result: paginationResult } = renderHook(() => usePaginationMeta())
      const { result: storeResult } = renderHook(() => useFilterStore())

      act(() => {
        storeResult.current.setPaginationMeta(100, true)
        storeResult.current.setPage(3)
      })

      expect(paginationResult.current).toEqual({
        totalJobs: 100,
        hasMore: true,
        currentPage: 3,
        limit: 20
      })
    })

    it('should provide filter actions selector', () => {
      const { result } = renderHook(() => useFilterActions())

      expect(typeof result.current.setFilters).toBe('function')
      expect(typeof result.current.updateFilter).toBe('function')
      expect(typeof result.current.clearFilters).toBe('function')
      expect(typeof result.current.resetPagination).toBe('function')
      expect(typeof result.current.setPage).toBe('function')
      expect(typeof result.current.setLoading).toBe('function')
      expect(typeof result.current.setPaginationMeta).toBe('function')
    })

    it('should provide computed selectors', () => {
      const { result: countResult } = renderHook(() => useActiveFiltersCount())
      const { result: hasActiveResult } = renderHook(() => useHasActiveFilters())
      const { result: storeResult } = renderHook(() => useFilterStore())

      expect(countResult.current).toBe(0)
      expect(hasActiveResult.current).toBe(false)

      act(() => {
        storeResult.current.updateFilter('location', 'New York')
      })

      expect(countResult.current).toBe(1)
      expect(hasActiveResult.current).toBe(true)
    })
  })
})