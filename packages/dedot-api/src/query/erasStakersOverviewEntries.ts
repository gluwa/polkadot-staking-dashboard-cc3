// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { ErasStakersOverviewEntries } from 'types'
import type { StakingChain } from '../types'

export const erasStakersOverviewEntries = async <T extends StakingChain>(
  api: LegacyClient<T>,
  era: number
): Promise<ErasStakersOverviewEntries> => {
  const result = await api.query.staking.erasStakersOverview.pagedEntries(era)

  return result.map(([key, value]) => [
    [key[0], key[1].address(api.consts.system.ss58Prefix)],
    value,
  ])
}
