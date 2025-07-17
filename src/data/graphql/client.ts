import { ApolloClient, from, gql, HttpLink, InMemoryCache } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RetryLink } from '@apollo/client/link/retry'

import { API_CONFIG, FEATURES_CONFIG } from '../../config/zephyr'
import { CACHE_POLICIES } from './constants'

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
      errorPolicy: CACHE_POLICIES.ERROR_POLICY,
      fetchPolicy: CACHE_POLICIES.DEFAULT,
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: CACHE_POLICIES.ERROR_POLICY,
      fetchPolicy: CACHE_POLICIES.DEFAULT,
    },
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
})

/**
 * Check if GraphQL is enabled in the current environment
 */
// eslint-disable-next-line import/no-unused-modules
export function isGraphQLEnabled(): boolean {
  return FEATURES_CONFIG.GRAPHQL_ENABLED && !!API_CONFIG.GRAPHQL.URL
}

/**
 * Handle GraphQL errors with graceful degradation
 * @param error The GraphQL error
 * @param fallbackValue The fallback value to return
 */
export function handleGraphQLError<T>(error: any, fallbackValue: T): T {
  if (!isGraphQLEnabled()) {
    console.info('GraphQL disabled, using fallback value')
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
      fetchPolicy: CACHE_POLICIES.NETWORK_ONLY,
    })
    return !!result.data
  } catch (error) {
    console.warn('GraphQL health check failed:', error)
    return false
  }
}
