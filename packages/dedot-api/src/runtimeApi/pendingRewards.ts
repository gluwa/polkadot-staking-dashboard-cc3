// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'

export const pendingRewards = async <T extends StakingChain>(
  api: LegacyClient<T>,
  address: string
) => await api.call.nominationPoolsApi.pendingRewards(address)
