// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import { AccountId32 } from 'dedot/codecs'
import type { StakingChain } from '../types'

export const claimedRewardsMulti = async <T extends StakingChain>(
  api: LegacyClient<T>,
  eraAddressPairs: Array<[string, string]>
) => {
  // Create the correct parameter format for multi query
  const params = eraAddressPairs.map(([era, address]) => [parseInt(era), new AccountId32(address)] as [number, AccountId32])
  const result = await api.query.staking.claimedRewards.multi(params)
  
  // Return just the claimed rewards data as expected by the interface
  return result
}
