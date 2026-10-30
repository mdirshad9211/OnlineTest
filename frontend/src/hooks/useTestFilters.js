import { useMemo, useState } from 'react'
import { mockTests } from '../data/mockTests'

export function useTestFilters() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All tests')

  const filteredTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return mockTests.filter((test) => {
      const matchesCategory = category === 'All tests' || test.category === category
      const matchesQuery =
        !normalizedQuery ||
        test.title.toLowerCase().includes(normalizedQuery) ||
        test.description.toLowerCase().includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })
  }, [category, query])

  return { category, filteredTests, query, setCategory, setQuery }
}
