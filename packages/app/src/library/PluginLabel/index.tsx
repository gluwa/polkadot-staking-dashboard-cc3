// Copyright 2024 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { faProjectDiagram } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { usePlugins } from 'contexts/Plugins'
import { Subscan } from 'controllers/Subscan'
import { Wrapper } from './Wrapper'
import type { PluginLabelProps } from './types'

export const PluginLabel = ({ plugin }: PluginLabelProps) => {
  const { plugins } = usePlugins()
  const explorer = Subscan.getExplorerUrl()
  const { activeAddress } = useActiveAccounts()

  return (
    <Wrapper $active={plugins.includes(plugin)}>
      <FontAwesomeIcon icon={faProjectDiagram} transform="shrink-4" />
      {plugins.includes(plugin) ? (
        <a
          href={`${explorer}/account/${activeAddress}`}
          target="_blank"
          rel="nofollow noopener noreferrer"
        >
          Subscan
        </a>
      ) : (
        'Subscan'
      )}
    </Wrapper>
  )
}
