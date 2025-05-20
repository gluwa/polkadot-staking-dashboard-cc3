// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { StakingChain } from '../types'

export const poolMetadataMulti = async <T extends StakingChain>(
  api: LegacyClient<T>,
  ids: number[]
) => await api.query.nominationPools.metadata.multi(ids)
