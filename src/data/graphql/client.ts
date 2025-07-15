import { ApolloClient, from, gql, HttpLink, InMemoryCache } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

import { API_CONFIG, FEATURES_CONFIG } from '../../config/zephyr'

// Error handling link for graceful degradation
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.warn(`GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`)
    })
  }

  if (networkError) {
    console.warn('Network error:', networkError)
    // Could implement fallback to cached data here
  }
})

// HTTP link with configuration
const httpLink = new HttpLink({
  uri: API_CONFIG.GRAPHQL.URL,
})

// Retry link for resilience
const retryLink = new RetryLink({
  delay: { initial: 300, max: Infinity, jitter: true },
  attempts: {
    max: API_CONFIG.GRAPHQL.RETRY_COUNT,
    retryIf: (error) => !!error && !error.message?.includes('400'),
  },
})

// Main Apollo Client for Zephyr GraphQL API
// eslint-disable-next-line import/no-unused-modules
export const zephyrGraphQLClient = new ApolloClient({
  link: from([errorLink, retryLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Token: {
        keyFields: ['id'],
        fields: {
          // Cache token data for 5 minutes
          priceUSD: {
            merge: true,
          },
          volumeUSD: {
            merge: true,
          },
        },
      },
      Pool: {
        keyFields: ['id'],
        fields: {
          totalValueLockedUSD: {
            merge: true,
          },
          volumeUSD: {
            merge: true,
          },
        },
      },
      Transaction: { keyFields: ['id'] },
      User: { keyFields: ['id'] },
      Position: { keyFields: ['id'] },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
})

// Utility function to check if GraphQL is enabled and available
// eslint-disable-next-line import/no-unused-modules
export function isGraphQLEnabled(): boolean {
  return FEATURES_CONFIG.GRAPHQL_ENABLED
}

// Utility function to handle GraphQL errors gracefully
// eslint-disable-next-line import/no-unused-modules
export function handleGraphQLError(error: any, fallbackValue: any = null) {
  if (!isGraphQLEnabled()) {
    console.log('GraphQL is disabled, using fallback')
    return fallbackValue
  }

  console.warn('GraphQL operation failed, using fallback:', error)
  return fallbackValue
}

const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    _meta {
      block {
        number
      }
    }
  }
`

// Health check function for GraphQL endpoint
// eslint-disable-next-line import/no-unused-modules
export async function checkGraphQLHealth(): Promise<boolean> {
  if (!isGraphQLEnabled()) return false

  try {
    const result = await zephyrGraphQLClient.query({
      query: HEALTH_CHECK_QUERY,
      fetchPolicy: 'network-only',
    })
    return !!result.data
  } catch (error) {
    console.warn('GraphQL health check failed:', error)
    return false
  }
}
