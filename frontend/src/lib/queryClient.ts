import { QueryClient } from '@tanstack/react-query'

// Estado de servidor compartido por toda la app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
