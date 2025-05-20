// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const transferKeepAlive = <T extends StakingChain>(
  api: LegacyClient<T>,
  to: string,
  value: bigint
) => asTx(api.tx.balances.transferKeepAlive(to, value))
