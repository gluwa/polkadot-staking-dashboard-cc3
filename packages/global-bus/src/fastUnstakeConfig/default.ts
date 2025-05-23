// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { FastUnstakeConfig, MetaInterface } from 'types'

export const defaultMeta: MetaInterface = {
  checked: [],
}

export const defaultFastUnstakeConfig: FastUnstakeConfig = {
  getLocalkey: () => '',
  checking: false,
  meta: defaultMeta,
  isExposed: null,
  head: undefined,
  queueDeposit: undefined,
  counterForQueue: undefined,
}
