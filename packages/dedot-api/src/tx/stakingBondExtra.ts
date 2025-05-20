// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const stakingBondExtra = <T extends StakingChain>(
  api: LegacyClient<T>,
  bond: bigint
) => asTx(api.tx.staking.bondExtra(bond))
