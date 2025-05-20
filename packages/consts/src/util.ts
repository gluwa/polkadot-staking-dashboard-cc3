// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { NetworkId, Networks } from 'types'
import { NetworkList } from './networks'
import { SupportedProxies } from './proxies'

// Check if proxy type is supported in the dashboard
export const isSupportedProxy = (proxy: string) =>
  Object.keys(SupportedProxies).includes(proxy) || proxy === 'Any'

// Check if proxy call is supported for a given proxy type
export const isSupportedProxyCall = (
  proxy: string,
  pallet: string,
  method: string
) => {
  if ([method, pallet].includes('undefined')) {
    return false
  }
  const call = `${pallet}.${method}`
  const calls = SupportedProxies[proxy]
  return (calls || []).find((c) => ['*', call].includes(c)) !== undefined
}

// Get network data from network list
export const getNetworkData = (network: NetworkId) => NetworkList[network]

// Get default rpc endpoints for a relay chain and accompanying system chains for a given network
export const getDefaultRpcEndpoints = (network: NetworkId) => {
  const relayRpcs = NetworkList[network].endpoints.rpc

  // Take a random rpc endpoint for the relay chain
  const relayRpc =
    Object.keys(relayRpcs)[
      Math.floor(Math.random() * Object.keys(relayRpcs).length)
    ]

  return {
    [network]: relayRpc,
  }
}

// Gets enabled networks depending on environment
export const getEnabledNetworks = (): Networks =>
  Object.entries(NetworkList).reduce((acc: Networks, [key, item]) => {
    if (!import.meta.env.PROD) {
      acc[key] = item
    }
    return acc
  }, {})

// Checks if a network is enabled
export const isNetworkEnabled = (network: NetworkId) =>
  Object.keys(getEnabledNetworks()).includes(network)
