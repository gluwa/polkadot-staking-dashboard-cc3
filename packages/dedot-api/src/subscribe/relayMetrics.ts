// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { Unsub } from 'dedot/types'
import { defaultRelayMetrics, setRelayMetrics } from 'global-bus'
import type { RelayMetrics } from 'types'
import type { RelayChain } from '../types'

export class RelayMetricsQuery<T extends RelayChain> {
  relayMetrics: RelayMetrics = defaultRelayMetrics

  #unsub: Unsub | undefined = undefined

  constructor(public api: LegacyClient<T>) {
    this.api = api
    this.subscribe()
  }

  async subscribe() {
    this.#unsub = await this.api.queryMulti(
      [
        {
          fn: this.api.query.balances.totalIssuance,
          args: [],
        },
        {
          fn: this.api.query.historical.storedRange,
          args: [],
        },
      ],
      ([totalIssuance, storedRange]) => {
        const earliestStoredSession = storedRange?.[0] ?? 0
        this.relayMetrics = {
          totalIssuance,
          earliestStoredSession,
        }
        setRelayMetrics(this.relayMetrics)
      }
    )
  }

  unsubscribe() {
    this.#unsub?.()
  }
}
