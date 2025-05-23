// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { FastUnstakeHead, FastUnstakeQueue, MaybeAddress } from 'types'

export interface LocalMeta {
  isExposed: boolean
  checked: number[]
}
export interface MetaInterface {
  checked: number[]
}

export interface FastUnstakeContextInterface {
  getLocalkey: (address: MaybeAddress) => string
  checking: boolean
  meta: MetaInterface
  isExposed: boolean | null
  queueDeposit: FastUnstakeQueue
  head: FastUnstakeHead | undefined
  counterForQueue: number | undefined
}
