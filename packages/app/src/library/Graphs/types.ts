// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type BigNumber from 'bignumber.js'
import type { SubscanPayoutData } from 'controllers/Subscan/types'

export interface BondedProps {
  active: BigNumber
  free: BigNumber
  unlocking: BigNumber
  unlocked: BigNumber
  inactive: boolean
}

export interface PayoutBarProps {
  days: number
  height: string
  data: SubscanPayoutData
  syncing: boolean
}

export interface PayoutLineProps {
  days: number
  average: number
  height: string
  background?: string
  data: SubscanPayoutData
}

export interface CardHeaderWrapperProps {
  $withAction?: boolean
  $withMargin?: boolean
}

export interface CardWrapperProps {
  height?: string | number
}

export interface PayoutDayCursor {
  amount: BigNumber
  event_id: string
}

export interface GeoDonutProps {
  title: string
  series: {
    labels: string[]
    data: number[]
  }
  width?: string | number
  maxHeight?: string | number
  legendHeight?: number
  maxLabelLen?: number
}

export interface PayoutLineEntry {
  era: number
  reward: string
  start: number
}
