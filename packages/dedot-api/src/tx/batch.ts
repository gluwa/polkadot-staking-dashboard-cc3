// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient, SubmittableExtrinsic } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const batch = <T extends StakingChain>(
  api: LegacyClient<T>,
  calls: SubmittableExtrinsic[]
): SubmittableExtrinsic => {
  const tx = asTx(api.tx.utility.batch(calls.map((call) => call.call)))
  return tx
}
