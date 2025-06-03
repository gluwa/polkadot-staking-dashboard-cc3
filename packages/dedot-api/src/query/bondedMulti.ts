// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'

export const bondedMulti = async <T extends StakingChain>(
  api: LegacyClient<T>,
  addresses: string[]
) => {
  const result = await api.query.staking.bonded.multi(addresses)

  return result.map((key) => key?.address(api.consts.system.ss58Prefix))
}
