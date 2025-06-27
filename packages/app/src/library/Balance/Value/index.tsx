// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Odometer } from '@w3ux/react-odometer'
import { rmCommas } from '@w3ux/utils'
import BigNumber from 'bignumber.js'
import type { ReactNode } from 'react'
import { TokenFiat } from 'ui-core/base'

export const Value = ({
  Token,
  tokenBalance,
}: {
  Token: ReactNode
  tokenBalance: string | number
}) => {
  // Convert to BigNumber and format with exactly 2 decimals and thousands separators
  const formattedValue = new BigNumber(rmCommas(String(tokenBalance)))
    .decimalPlaces(2)
    .toFormat(2)

  return (
    <TokenFiat Token={Token}>
      <h1>
        <Odometer value={formattedValue} />
      </h1>
    </TokenFiat>
  )
}
