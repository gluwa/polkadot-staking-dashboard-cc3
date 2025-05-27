// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { RewardResults } from 'plugin-staking-api/types'

export interface PayoutListProps {
  allowMoreCols?: boolean
  pagination?: boolean
  title?: string | null
  itemsPerPage: number
  payoutsList?: RewardResults
  payouts: RewardResults | (() => RewardResults)
}
