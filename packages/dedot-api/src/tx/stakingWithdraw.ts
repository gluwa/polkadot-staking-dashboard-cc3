// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const stakingWithdraw = <T extends StakingChain>(
  api: LegacyClient<T>,
  numSlashingSpans: number
) => asTx(api.tx.staking.withdrawUnbonded(numSlashingSpans))
