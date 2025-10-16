// Copyright 2024 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import BigNumber from 'bignumber.js'
import type { EraUnclaimedPayouts } from 'contexts/Payouts/types'

export const getTotalPayout = (
  unclaimedPayout: EraUnclaimedPayouts
): BigNumber =>
  Object.values(unclaimedPayout).reduce(
    (acc: BigNumber, cur: [string, string]) => {
      // Extract the amount (second element of the tuple)
      const amount = cur[1] || '0'
      const payoutValue = new BigNumber(amount)
      return acc.plus(payoutValue.isNaN() ? 0 : payoutValue)
    },
    new BigNumber(0)
  )
