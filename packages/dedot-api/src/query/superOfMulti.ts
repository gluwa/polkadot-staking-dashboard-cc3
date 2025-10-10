// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'

export const superOfMulti = async <T extends StakingChain>(
  api: LegacyClient<T>,
  addresses: string[]
) => {
  // Since identity pallet doesn't have multi method, fetch individually
  const results = await Promise.all(
    addresses.map((address) => api.query.identity.superOf(address))
  )
  return results
}
