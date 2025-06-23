// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Odometer } from '@w3ux/react-odometer'
import { minDecimalPlaces, rmCommas } from '@w3ux/utils'
import BigNumber from 'bignumber.js'
import { getNetworkData } from 'consts/util'
import { useNetwork } from 'contexts/Network'
import type { ReactNode } from 'react'
import { TokenFiat } from 'ui-core/base'

export const Value = ({
  Token,
  tokenBalance,
}: {
  Token: ReactNode
  tokenBalance: string | number
}) => {
  const { network } = useNetwork()
  const { units } = getNetworkData(network)
  // Convert balance to fiat value
  const freeFiat = new BigNumber(rmCommas(String(tokenBalance))).decimalPlaces(
    2
  )

  const valueFormatted =
    String(freeFiat) === '0' ? 0 : new BigNumber(freeFiat).toFormat(units)

  return (
    <TokenFiat Token={Token}>
      <h1>
        <Odometer
          value={minDecimalPlaces(valueFormatted, 2)}
          zeroDecimals={2}
        />
      </h1>
    </TokenFiat>
  )
}
