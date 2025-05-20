// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'

export const sessionValidators = async <T extends StakingChain>(
  api: LegacyClient<T>
) => {
  const result = await api.query.session.validators()
  return result.map((address) => address.address(api.consts.system.ss58Prefix))
}
