// Copyright 2024 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { usePlugins } from 'contexts/Plugins'
import { Subscan } from 'controllers/Subscan'
import type { SubscanEraPoints } from 'controllers/Subscan/types'
import { EraPointsLine } from 'library/Graphs/EraPointsLine'
import { StatusLabel } from 'library/StatusLabel'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InactiveGraph } from './InactiveGraph'

interface Props {
  validator: string
  fromEra: number
  width: string | number
  height: string | number
}
export const ActiveGraph = ({ validator, fromEra, width, height }: Props) => {
  const [list, setList] = useState<SubscanEraPoints[]>([])
  const { t } = useTranslation('pages')
  const { plugins } = usePlugins()

  const handleEraPoints = async () => {
    setList(await Subscan.handleFetchEraPoints(validator, fromEra))
  }

  useEffect(() => {
    if (plugins.includes('subscan')) {
      handleEraPoints()
    }
  }, [validator, fromEra, plugins.includes('subscan')])
  const sorted = [...list].sort((a, b) => a.era - b.era)

  return (
    <div
      className="inner"
      style={{
        width,
        height,
      }}
    >
      {!plugins.includes('subscan') ? (
        <>
          <StatusLabel
            status="active_service"
            statusFor="subscan"
            title={t('subscanDisabled')}
            topOffset="37%"
          />
          <InactiveGraph width={width} height={height} />
        </>
      ) : (
        <EraPointsLine
          syncing={false}
          entries={sorted}
          width={width}
          height={height}
        />
      )}
    </div>
  )
}
