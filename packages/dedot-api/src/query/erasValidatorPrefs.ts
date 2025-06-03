// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import { AccountId32 } from 'dedot/codecs'
import type { StakingChain } from '../types'

export const erasValidatorPrefs = async <T extends StakingChain>(
  api: LegacyClient<T>,
  era: number,
  address: string
) => await api.query.staking.erasValidatorPrefs([era, new AccountId32(address)])
