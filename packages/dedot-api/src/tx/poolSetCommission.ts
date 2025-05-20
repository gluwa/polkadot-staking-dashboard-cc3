// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const poolSetCommission = <T extends StakingChain>(
  api: LegacyClient<T>,
  poolId: number,
  commission?: [number, string]
) => asTx(api.tx.nominationPools.setCommission(poolId, commission))
