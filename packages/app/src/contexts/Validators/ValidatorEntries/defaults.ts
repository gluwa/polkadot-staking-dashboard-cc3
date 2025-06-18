// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import BigNumber from 'bignumber.js'
import type { EraPointsBoundaries } from '../types'

export const defaultAverageEraValidatorReward = {
  days: 0,
  reward: new BigNumber(0),
}

export const defaultValidatorsData = {
  entries: [],
  notFullCommissionCount: 0,
  totalNonAllCommission: new BigNumber(0),
}

export const defaultEraPointsBoundaries: EraPointsBoundaries = null
