import { useLocation } from 'react-router-dom'

export function useIsPoolsPage(): boolean {
  const { pathname } = useLocation()
  return pathname.startsWith('/pool') || pathname.startsWith('/pools')
}
