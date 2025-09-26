// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { PalletIdentityJudgement } from 'dedot/chaintypes'
import type { AccountId32 } from 'dedot/codecs'
import type { AnyJson } from './common'

export type IdentityOf =
  | {
      info: {
        display: {
          type: string
          value?: string
        }
      }
      judgements: [number, PalletIdentityJudgement][]
      deposit: bigint
    }
  | undefined

export type SuperOf =
  | {
      address: string
      account: AccountId32
      identity: IdentityOf
      value: {
        type: string
        value?: string
      }
    }
  | undefined

export interface IdentityItem {
  deposit: string;
  info: AnyJson;
  judgements: AnyJson[];
}

// New structure: Identity is now an array where [0] contains the identity object
export type Identity = [IdentityItem | null, null] | null;

export interface SuperIdentity {
  superOf: {
    identity: IdentityOf
    value: {
      type: string
      value?: string
    }
  }
  value: string
}
