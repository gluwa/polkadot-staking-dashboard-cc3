// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { AnyJson } from '@w3ux/types'
import BigNumber from 'bignumber.js'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import type { AnyApi } from 'common-types'
import { getNetworkData } from 'consts/util'
import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { useBalances } from 'contexts/Balances'
import { useNetwork } from 'contexts/Network'
import { useStaking } from 'contexts/Staking'
import { useThemeValues } from 'contexts/ThemeValues'
import { format, fromUnixTime } from 'date-fns'
import { useSyncing } from 'hooks/useSyncing'
import { DefaultLocale, locales } from 'locales'
import { Bar } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { Spinner } from 'ui-core/base'
import type { PayoutBarProps } from './types'
import { formatRewardsForGraphs } from './Utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export const PayoutBar = ({
  days,
  height,
  data: { payouts, poolClaims, unclaimedPayouts },
  syncing,
}: PayoutBarProps) => {
  const { i18n, t } = useTranslation('app')
  const { getThemeValue } = useThemeValues()
  const { network } = useNetwork()
  const { inSetup } = useStaking()
  const { getPoolMembership } = useBalances()
  const { syncing } = useSyncing(['balances'])
  const { activeAccount } = useActiveAccounts()

  const membership = getPoolMembership(activeAccount)
  const { unit, units } = getNetworkData(network)
  const notStaking = !syncing && inSetup() && !membership

  // remove slashes from payouts (graph does not support negative values).
  const payoutsNoSlash = payouts?.filter((p) => p.event_id !== 'Slashed') || []

  // remove slashes from unclaimed payouts.
  const unclaimedPayoutsNoSlash =
    unclaimedPayouts?.filter((p) => p.event_id !== 'Slashed') || []

  // Get formatted rewards data
  const { allPayouts, allPoolClaims, allUnclaimedPayouts } =
    formatRewardsForGraphs(
      new Date(),
      days,
      units,
      payoutsNoSlash,
      poolClaims,
      unclaimedPayoutsNoSlash
    )
  const { p: graphPayouts } = allPayouts
  const { p: graphUnclaimedPayouts } = allUnclaimedPayouts
  const { p: graphPoolClaims } = allPoolClaims

  // Determine color for payouts
  const colorPayouts = notStaking
    ? getThemeValue('--accent-color-transparent')
    : getThemeValue('--accent-color-primary')

  // Determine color for poolClaims
  const colorPoolClaims = !staking
    ? getThemeValue('--accent-color-transparent')
    : getThemeValue('--accent-color-secondary')

  const borderRadius = 3.5
  const pointRadius = 0
  const data = {
    labels: graphPayouts.map((item: AnyApi) => {
      const dateObj = format(fromUnixTime(item.block_timestamp), 'do MMM', {
        locale: locales[i18n.resolvedLanguage ?? DefaultLocale].dateFormat,
      })
      return `${dateObj}`
    }),

    datasets: [
      {
        order: 1,
        label: t('payout'),
        data: graphPayouts.map((item: AnyApi) => item.amount),
        borderColor: colorPayouts,
        backgroundColor: colorPayouts,
        pointRadius,
        borderRadius,
      },
      {
        order: 2,
        label: t('poolClaim'),
        data: graphPoolClaims.map((item: AnyApi) => item.amount),
        borderColor: colorPoolClaims,
        backgroundColor: colorPoolClaims,
        pointRadius,
        borderRadius,
      },
      {
        order: 3,
        data: graphUnclaimedPayouts.map((item: AnyApi) => item.amount),
        label: t('unclaimedPayouts'),
        borderColor: colorPayouts,
        backgroundColor: getThemeValue('--accent-color-pending'),
        pointRadius,
        borderRadius,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.5,
    maxBarThickness: 12,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          autoSkip: true,
        },
      },
      y: {
        stacked: true,
        ticks: {
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
        grid: {
          color: getThemeValue('--grid-color-secondary'),
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: getThemeValue('--background-invert'),
        titleColor: getThemeValue('--text-color-invert'),
        bodyColor: getThemeValue('--text-color-invert'),
        bodyFont: {
          weight: 600,
        },
        callbacks: {
          title: () => [],
          label: (context: AnyJson) =>
            `${
              context.dataset.order === 3 ? `${t('pending')}: ` : ''
            }${new BigNumber(context.parsed.y)
              .decimalPlaces(units)
              .toFormat()} ${unit}`,
        },
      },
    },
  }

  return (
    <div
      style={{
        height: height || 'auto',
      }}
    >
      {syncing && (
        <Spinner
          style={{ position: 'absolute', right: '2.5rem', top: '-2.5rem' }}
        />
      )}
      <Bar options={options} data={data} />
    </div>
  )
}
