// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import { AccountId32 } from 'dedot/codecs'
import type { StakingChain } from '../types'

export const claimedRewards = async <T extends StakingChain>(
  api: LegacyClient<T>,
  address: string,
  era: number
) => await api.query.staking.claimedRewards([era, new AccountId32(address)])
