// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { PolkadotApi } from '@dedot/chaintypes'
import type { CreditcoinServiceInterface } from 'types'
import type { CreditcoinService } from '../services/creditcoin'

// All available chains
export type Chain = PolkadotApi

// Relay chains
export type RelayChain = PolkadotApi

// Chains that are used for staking and nomination pools
export type StakingChain = PolkadotApi

// Mapping of service types for each network
export interface ServiceType {
  'creditcoin3-dev': typeof CreditcoinService
  'creditcoin3-testnet': typeof CreditcoinService
}

// Mapping of the required chains for each service
export type Service = {
  'creditcoin3-dev': [PolkadotApi]
  'creditcoin3-testnet': [PolkadotApi]
}

// Generic service class that all services must implement
export abstract class ServiceClass {
  abstract interface: CreditcoinServiceInterface

  abstract start(): Promise<void>
  abstract unsubscribe(): Promise<void>
}
