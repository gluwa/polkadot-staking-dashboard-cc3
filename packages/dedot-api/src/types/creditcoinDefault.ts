// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { Subscription } from 'rxjs'
import type {
  CreditcoinServiceInterface,
  NetworkConfig,
  NetworkId,
} from 'types'
import type { RelayChain, Service, ServiceType, StakingChain } from '.'
import { ServiceClass } from '.'
import type { CoreConsts } from '../consts/core'
import type { StakingConsts } from '../consts/staking'
import type { ApiStatus } from '../spec/apiStatus'
import type { ChainSpecs } from '../spec/chainSpecs'
import type { AccountBalanceQuery } from '../subscribe/accountBalance'
import type { ActiveEraQuery } from '../subscribe/activeEra'
import type { ActivePoolQuery } from '../subscribe/activePool'
import type { BlockNumberQuery } from '../subscribe/blockNumber'
import type { EraRewardPointsQuery } from '../subscribe/eraRewardPoints'
import type { FastUnstakeQueueQuery } from '../subscribe/fastUnstakeQueue'
import type { PoolsConfigQuery } from '../subscribe/poolsConfig'
import type { ProxiesQuery } from '../subscribe/proxies'
import type { RelayMetricsQuery } from '../subscribe/relayMetrics'
import type { StakingLedgerQuery } from '../subscribe/stakingLedger'
import type { StakingMetricsQuery } from '../subscribe/stakingMetrics'

// Required interface for all default services
export abstract class CreditcoinDefaultServiceClass<
  RelayApi extends RelayChain,
  StakingApi extends StakingChain,
> extends ServiceClass {
  constructor(
    public networkConfig: NetworkConfig,
    public apiRelay: LegacyClient<RelayApi>
  ) {
    super()
  }
  abstract ids: [NetworkId]
  abstract apiStatus: {
    relay: ApiStatus<RelayApi>
  }
  abstract getApi: (id: string) => LegacyClient<RelayApi>

  abstract relayChainSpec: ChainSpecs<RelayApi>

  abstract coreConsts: CoreConsts<RelayApi>
  abstract stakingConsts: StakingConsts<StakingApi>
  abstract blockNumber: BlockNumberQuery<RelayApi>
  abstract activeEra: ActiveEraQuery<StakingApi>
  abstract relayMetrics: RelayMetricsQuery<RelayApi>
  abstract poolsConfig: PoolsConfigQuery<StakingApi>
  abstract stakingMetrics: StakingMetricsQuery<StakingApi>
  abstract eraRewardPoints: EraRewardPointsQuery<StakingApi>
  abstract fastUnstakeQueue: FastUnstakeQueueQuery<StakingApi>

  subActiveAddress: Subscription
  subImportedAccounts: Subscription
  subActiveEra: Subscription
  subAccountBalances: AccountBalances<RelayApi>
  subStakingLedgers: StakingLedgers<StakingApi>
  subActivePoolIds: Subscription
  subActivePools: ActivePools<StakingApi>
  subProxies: Proxies<StakingApi>

  abstract interface: CreditcoinServiceInterface
}

// Default interface a default service factory returns
export type CreditcoinDefaultService<T extends keyof ServiceType> = {
  Service: ServiceType[T]
  apis: [LegacyClient<Service[T][0]>]
  ids: [NetworkId]
}

// Account balances record
export type AccountBalances<RelayApi extends RelayChain> = {
  relay: Record<string, AccountBalanceQuery<RelayApi>>
}

// Staking ledgers record
export type StakingLedgers<StakingApi extends StakingChain> = Record<
  string,
  StakingLedgerQuery<StakingApi>
>

// Active pools record
export type ActivePools<StakingApi extends StakingChain> = Record<
  number,
  ActivePoolQuery<StakingApi>
>

// Proxies record
export type Proxies<StakingApi extends StakingChain> = Record<
  string,
  ProxiesQuery<StakingApi>
>
