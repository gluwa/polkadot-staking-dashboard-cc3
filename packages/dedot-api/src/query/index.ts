// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { bondedPool } from './bondedPool'
import { bondedPoolEntries } from './bondedPoolEntries'
import { erasStakersOverviewEntries } from './erasStakersOverviewEntries'
import { erasStakersPagedEntries } from './erasStakersPagedEntries'
import { erasValidatorRewardMulti } from './erasValidatorRewardMulti'
import { nominatorsMulti } from './nominatorsMulti'
import { poolMembersMulti } from './poolMembersMulti'
import { poolMetadataMulti } from './poolMetadataMulti'
import { proxies } from './proxies'
import { sessionValidators } from './sessionValidators'
import { validatorEntries } from './validatorEntries'
import { validatorsMulti } from './validatorsMulti'

export const query = {
  bondedPool,
  bondedPoolEntries,
  erasStakersOverviewEntries,
  erasStakersPagedEntries,
  erasValidatorRewardMulti,
  nominatorsMulti,
  poolMembersMulti,
  poolMetadataMulti,
  proxies,
  sessionValidators,
  validatorEntries,
  validatorsMulti,
}
