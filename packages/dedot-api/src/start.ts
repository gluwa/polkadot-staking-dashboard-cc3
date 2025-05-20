// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { getNetworkData } from 'consts/util'
import { LegacyClient, WsProvider } from 'dedot'
import { setMultiApiStatus } from 'global-bus'
import type { NetworkConfig, NetworkId } from 'types'
import { Services } from './services'
import { newRelayChainSmProvider } from './smoldot/providers'
import type { Service } from './types'
import type { CreditcoinDefaultService } from './types/creditcoinDefault'

// Determines service class and apis for a network
export const getDefaultService = async <T extends NetworkId>(
  network: T,
  { rpcEndpoints, providerType }: Omit<NetworkConfig, 'network'>
): Promise<CreditcoinDefaultService<T>> => {
  const relayData = getNetworkData(network)

  const ids = [network] as [NetworkId]

  const relayProvider =
    providerType === 'ws'
      ? new WsProvider(relayData.endpoints.rpc[rpcEndpoints[network]])
      : await newRelayChainSmProvider(relayData)

  setMultiApiStatus({
    [network]: 'connecting',
  })

  const apiRelay = await LegacyClient.new<Service[T][0]>(relayProvider)

  setMultiApiStatus({
    [network]: 'ready',
  })

  return {
    Service: Services[network],
    apis: [apiRelay],
    ids,
  }
}
