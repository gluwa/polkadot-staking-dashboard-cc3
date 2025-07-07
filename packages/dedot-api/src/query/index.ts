// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { bondedMulti } from './bondedMulti'
import { bondedPool } from './bondedPool'
import { bondedPoolEntries } from './bondedPoolEntries'
import { claimedRewards } from './claimedRewards'
import { eraRewardPoints } from './eraRewardPoints'
import { erasRewardPointsMulti } from './erasRewardPointsMulti'
import { erasStakersOverviewEntries } from './erasStakersOverviewEntries'
import { erasStakersPagedEntries } from './erasStakersPagedEntries'
import { erasValidatorPrefs } from './erasValidatorPrefs'
import { erasValidatorRewardMulti } from './erasValidatorRewardMulti'
import { ledgerMulti } from './ledgerMulti'
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
  erasRewardPointsMulti,
  erasValidatorRewardMulti,
  nominatorsMulti,
  poolMembersMulti,
  poolMetadataMulti,
  proxies,
  sessionValidators,
  validatorEntries,
  validatorsMulti,
  claimedRewards,
  eraRewardPoints,
  erasValidatorPrefs,
  bondedMulti,
  ledgerMulti,
}
