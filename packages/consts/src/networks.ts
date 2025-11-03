// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { NetworkId, Networks } from 'types'

// The default network to use when no network is specified
export const DefaultNetwork: NetworkId = 'creditcoin3-dev'

// All supported networks
export const NetworkList: Networks = {
  'creditcoin3-dev': {
    name: 'creditcoin3-dev',
    endpoints: {
      rpc: {
        'CC3-Devnet': 'wss://rpc.cc3-devnet.creditcoin.network/ws',
      },
      subscan: {
        api: 'https://creditcoin3-dev.api.subscan.io',
        explorer: 'https://creditcoin3-dev.subscan.io',
      },
    },
    unit: 'CTC',
    units: 18,
    ss58: 42,
    defaultFeeReserve: 100000000000000000n,
  },
  'creditcoin3-testnet': {
    name: 'creditcoin3-testnet',
    endpoints: {
      rpc: {
        'CC3-Testnet': 'wss://rpc.cc3-testnet.creditcoin.network/ws',
      },
      subscan: {
        api: 'https://creditcoin3-testnet.api.subscan.io',
        explorer: 'https://creditcoin3-testnet.subscan.io',
      },
    },
    unit: 'CTC',
    units: 18,
    ss58: 42,
    defaultFeeReserve: 100000000000000000n,
  },
  'creditcoin3-dryrun': {
    name: 'creditcoin3-dryrun',
    endpoints: {
      rpc: {
        'creditcoin3-dryrun':
          'wss://rpc.cc3-devnet-dryrun.creditcoin.network/ws',
      },
    },
    unit: 'CTC',
    units: 18,
    ss58: 42,
    defaultFeeReserve: 100000000000000000n,
  },
}
