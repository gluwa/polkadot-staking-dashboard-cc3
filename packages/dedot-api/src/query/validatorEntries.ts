// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { PalletStakingValidatorPrefs } from 'dedot/chaintypes'
import type { StakingChain } from '../types'

export const validatorEntries = async <T extends StakingChain>(
  api: LegacyClient<T>
): Promise<[string, PalletStakingValidatorPrefs][]> => {
  const result = await api.query.staking.validators.pagedEntries()

  return result.map(([key, value]) => [
    key.address(api.consts.system.ss58Prefix),
    value,
  ])
}
