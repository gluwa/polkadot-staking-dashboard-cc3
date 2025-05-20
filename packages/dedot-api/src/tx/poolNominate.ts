// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const poolNominate = <T extends StakingChain>(
  api: LegacyClient<T>,
  poolId: number,
  nominees: string[]
) => asTx(api.tx.nominationPools.nominate(poolId, nominees))
