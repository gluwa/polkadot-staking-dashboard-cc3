// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient, SubmittableExtrinsic } from 'dedot'
import type { StakingChain } from '../types'
import { asTx } from '../util'

export const proxy = <T extends StakingChain>(
  api: LegacyClient<T>,
  real: string,
  call: SubmittableExtrinsic
): SubmittableExtrinsic => {
  const tx = asTx(api.tx.proxy.proxy(real, undefined, call.call))
  return tx
}
