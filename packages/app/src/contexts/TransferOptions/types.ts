// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { MaybeAddress } from 'types'

export interface TransferOptionsContextInterface {
  getTransferOptions: (address: MaybeAddress) => TransferOptions
  setFeeReserveBalance: (reserve: bigint) => void
  feeReserve: bigint
  getFeeReserve: (address: MaybeAddress) => bigint
}

export interface TransferOptions {
  freeBalance: bigint
  transferrableBalance: bigint
  balanceTxFees: bigint
  edReserved: bigint
  nominate: {
    active: bigint
    totalUnlocking: bigint
    totalUnlocked: bigint
    totalPossibleBond: bigint
    totalAdditionalBond: bigint
    totalUnlockChunks: number
  }
  pool: {
    active: bigint
    totalUnlocking: bigint
    totalUnlocked: bigint
    totalPossibleBond: bigint
    totalUnlockChunks: number
  }
}
