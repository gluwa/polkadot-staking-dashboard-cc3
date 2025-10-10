// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { Client, SmoldotBytecode } from 'smoldot'
import { startWithBytecode } from 'smoldot/no-auto-bytecode'
import type { WorkerOpts } from './types'

// Instantiate smoldot client
//
// Based on the example of smoldot from worker documentation at:
// <https://github.com/smol-dot/smoldot/tree/main/wasm-node/javascript#usage-with-a-worker>
export const doInitSmWorker = (
  worker: Worker,
  opts: WorkerOpts = {}
): Client => {
  const bytecode = new Promise<SmoldotBytecode>(
    (resolve) => (worker.onmessage = ({ data }) => resolve(data))
  )
  const { port1, port2: portToWorker } = new MessageChannel()
  worker.postMessage(port1, [port1])
  return startWithBytecode({ bytecode, portToWorker, ...opts })
}
