#!/bin/bash

# Generate runtime configuration from environment variables
# This script runs at container startup to create env-config.js with current environment values

CONFIG_FILE="${CONFIG_FILE:-/app/build/env-config.js}"

# Function to add a property to the config object only if the environment variable is set
add_property() {
  local key="$1"
  local env_var="$2"
  local is_string="${3:-true}"
  
  if [ -n "${!env_var}" ]; then
    if [ "$is_string" = "true" ]; then
      echo "  $key: '${!env_var}',"
    else
      echo "  $key: ${!env_var},"
    fi
  fi
}

cat > "$CONFIG_FILE" << EOF
// Runtime environment configuration
// This file is generated at container startup and can be modified without rebuilding
window.ENV_CONFIG = {
EOF

# Network Configuration
add_property "CHAIN_ID" "REACT_APP_CUSTOM_NETWORK_CHAIN_ID" false >> "$CONFIG_FILE"
add_property "NETWORK_NAME" "REACT_APP_CUSTOM_NETWORK_NAME" >> "$CONFIG_FILE"
add_property "RPC_URL" "REACT_APP_CUSTOM_NETWORK_RPC_URL" >> "$CONFIG_FILE"
add_property "RPC_FALLBACK" "REACT_APP_ZEPHYR_RPC_FALLBACK" >> "$CONFIG_FILE"
add_property "RPC_TIMEOUT" "REACT_APP_RPC_TIMEOUT" false >> "$CONFIG_FILE"

# Explorer Configuration
add_property "EXPLORER_URL" "REACT_APP_CUSTOM_NETWORK_EXPLORER_URL" >> "$CONFIG_FILE"
add_property "EXPLORER_API" "REACT_APP_ZEPHYR_EXPLORER_API" >> "$CONFIG_FILE"

# Service URLs
add_property "BRIDGE_URL" "REACT_APP_CUSTOM_NETWORK_BRIDGE_URL" >> "$CONFIG_FILE"
add_property "FAUCET_URL" "REACT_APP_CUSTOM_NETWORK_FAUCET_URL" >> "$CONFIG_FILE"

# API Configuration
add_property "API_URL" "REACT_APP_API_URL" >> "$CONFIG_FILE"
add_property "API_CACHE_STALE_TIME" "REACT_APP_API_CACHE_STALE_TIME" false >> "$CONFIG_FILE"
add_property "API_CACHE_GC_TIME" "REACT_APP_API_CACHE_GC_TIME" false >> "$CONFIG_FILE"

# Token Configuration
add_property "BASE_TOKEN_ADDRESS" "REACT_APP_ZEPHYR_BASE_TOKEN_ADDRESS" >> "$CONFIG_FILE"
add_property "BASE_TOKEN_SYMBOL" "REACT_APP_ZEPHYR_BASE_TOKEN_SYMBOL" >> "$CONFIG_FILE"
add_property "BASE_TOKEN_NAME" "REACT_APP_ZEPHYR_BASE_TOKEN_NAME" >> "$CONFIG_FILE"

# Contract Addresses
add_property "V3_FACTORY_ADDRESS" "REACT_APP_CUSTOM_NETWORK_V3_FACTORY_ADDRESS" >> "$CONFIG_FILE"
add_property "POSITION_MANAGER_ADDRESS" "REACT_APP_CUSTOM_NETWORK_POSITION_MANAGER_ADDRESS" >> "$CONFIG_FILE"
add_property "SWAP_ROUTER_ADDRESS" "REACT_APP_CUSTOM_NETWORK_SWAP_ROUTER_ADDRESS" >> "$CONFIG_FILE"
add_property "QUOTER_ADDRESS" "REACT_APP_CUSTOM_NETWORK_QUOTER_ADDRESS" >> "$CONFIG_FILE"
add_property "MULTICALL_ADDRESS" "REACT_APP_CUSTOM_NETWORK_MULTICALL_ADDRESS" >> "$CONFIG_FILE"
add_property "TICK_LENS_ADDRESS" "REACT_APP_CUSTOM_NETWORK_TICK_LENS_ADDRESS" >> "$CONFIG_FILE"
add_property "V3_MIGRATOR_ADDRESS" "REACT_APP_CUSTOM_NETWORK_V3_MIGRATOR_ADDRESS" >> "$CONFIG_FILE"
add_property "DELEGATION_ADDRESS" "REACT_APP_CUSTOM_NETWORK_DELEGATION_ADDRESS" >> "$CONFIG_FILE"

# Zephyr Protocol Addresses (optional)
add_property "LIQUIDITY_MANAGER_ADDRESS" "REACT_APP_ZEPHYR_LIQUIDITY_MANAGER_ADDRESS" >> "$CONFIG_FILE"
add_property "EXCHANGER_ADDRESS" "REACT_APP_ZEPHYR_EXCHANGER_ADDRESS" >> "$CONFIG_FILE"
add_property "PAIR_FACTORY_ADDRESS" "REACT_APP_ZEPHYR_PAIR_FACTORY_ADDRESS" >> "$CONFIG_FILE"

# Token Addresses
add_property "WRAPPED_NATIVE_ADDRESS" "REACT_APP_CUSTOM_NETWORK_WRAPPED_NATIVE_ADDRESS" >> "$CONFIG_FILE"
add_property "USDC_ADDRESS" "REACT_APP_CUSTOM_NETWORK_USDC_ADDRESS" >> "$CONFIG_FILE"

# Feature Flags
add_property "ANALYTICS_ENABLED" "REACT_APP_ANALYTICS_ENABLED" false >> "$CONFIG_FILE"
add_property "GRAPHQL_ENABLED" "REACT_APP_ENABLE_GRAPHQL" false >> "$CONFIG_FILE"
add_property "PRIVACY_MODE" "REACT_APP_PRIVACY_MODE" false >> "$CONFIG_FILE"
add_property "DEBUG_MODE" "REACT_APP_DEBUG_MODE" false >> "$CONFIG_FILE"
add_property "CACHE_ENABLED" "REACT_APP_CACHE_ENABLED" false >> "$CONFIG_FILE"
add_property "IS_STAGING" "REACT_APP_STAGING" false >> "$CONFIG_FILE"
add_property "IS_UNISWAP_INTERFACE" "REACT_APP_IS_UNISWAP_INTERFACE" false >> "$CONFIG_FILE"
add_property "SKIP_CSP" "REACT_APP_SKIP_CSP" false >> "$CONFIG_FILE"

# External Services
add_property "INFURA_KEY" "REACT_APP_INFURA_KEY" >> "$CONFIG_FILE"
add_property "ALCHEMY_API_KEY" "REACT_APP_ALCHEMY_API_KEY" >> "$CONFIG_FILE"
add_property "WALLET_CONNECT_PROJECT_ID" "REACT_APP_WALLET_CONNECT_PROJECT_ID" >> "$CONFIG_FILE"
add_property "Z_WALLET_CLIENT_URL" "REACT_APP_Z_WALLET_CLIENT_URL" >> "$CONFIG_FILE"
add_property "Z_WALLET_RPC_URL" "REACT_APP_Z_WALLET_RPC_URL" >> "$CONFIG_FILE"
add_property "Z_WALLET_EXPLORER_URL" "REACT_APP_Z_WALLET_EXPLORER_URL" >> "$CONFIG_FILE"
add_property "Z_WALLET_PERSISTENCE_TTL" "REACT_APP_Z_WALLET_PERSISTENCE_TTL" false >> "$CONFIG_FILE"
add_property "Z_WALLET_TIMEOUT" "REACT_APP_Z_WALLET_TIMEOUT" false >> "$CONFIG_FILE"

# Token Filter
add_property "QUICK_ACCESS_TOKENS" "REACT_APP_QUICK_ACCESS_TOKENS" >> "$CONFIG_FILE"

cat >> "$CONFIG_FILE" << EOF
};
EOF

echo "Runtime configuration generated at $CONFIG_FILE"
