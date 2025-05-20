// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { LegacyClient } from 'dedot'
import type { BondedPoolQuery } from 'types'
import type { StakingChain } from '../types'

export const bondedPoolEntries = async <T extends StakingChain>(
  api: LegacyClient<T>
): Promise<[number, BondedPoolQuery][]> => {
  const results = await api.query.nominationPools.bondedPools.pagedEntries()

  return results.map(([id, pool]) => {
    const current: [number, string] | undefined = pool.commission.current
      ? [
          pool.commission.current[0],
          pool.commission.current[1].address(api.consts.system.ss58Prefix),
        ]
      : undefined

    return [
      id,
      {
        ...pool,
        roles: {
          depositor: pool.roles.depositor.address(api.consts.system.ss58Prefix),
          nominator: pool?.roles.nominator?.address(
            api.consts.system.ss58Prefix
          ),
          root: pool?.roles.root?.address(api.consts.system.ss58Prefix),
          bouncer: pool?.roles.bouncer?.address(api.consts.system.ss58Prefix),
        },
        commission: {
          ...pool.commission,
          current,
        },
      },
    ]
  })
}
