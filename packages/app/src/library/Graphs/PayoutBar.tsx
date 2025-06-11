// Copyright 2024 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

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
import { useTheme } from 'contexts/Themes'
import { useThemeValues } from 'contexts/ThemeValues'
import { format, fromUnixTime } from 'date-fns'
import { useSyncing } from 'hooks/useSyncing'
import { DefaultLocale, locales } from 'locales'
import { Bar } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import graphColors from 'styles/graphs/index.json'
import type { AnyJson } from 'types'
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
}: PayoutBarProps) => {
  const { i18n, t } = useTranslation('pages')
  const { mode } = useTheme()
  const { inSetup } = useStaking()
  const { getStakingLedger } = useBalances()
  const { activeAddress } = useActiveAccounts()
  const { poolMembership } = getStakingLedger(activeAddress)
  const { syncing } = useSyncing(['balances'])
  const { network } = useNetwork()
  const { unit, units } = getNetworkData(network)
  const notStaking = !syncing && inSetup() && !poolMembership
  const { getThemeValue } = useThemeValues()

  // remove slashes from payouts (graph does not support negative values).
  const payoutsNoSlash = payouts?.filter((p) => p.event_id !== 'Slashed') || []

  // remove slashes from unclaimed payouts.
  const unclaimedPayoutsNoSlash =
    unclaimedPayouts?.filter((p) => p.event_id !== 'Slashed') || []

  // get formatted rewards data for graph.
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
  const colorPoolClaims = notStaking
    ? getThemeValue('--accent-color-transparent')
    : getThemeValue('--accent-color-secondary')

  // Bar border radius
  const borderRadius = 4

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
        pointRadius: 0,
        borderRadius,
      },
      {
        order: 2,
        label: t('poolClaim'),
        data: graphPoolClaims.map((item: AnyApi) => item.amount),
        borderColor: colorPoolClaims,
        backgroundColor: colorPoolClaims,
        pointRadius: 0,
        borderRadius,
      },
      {
        order: 3,
        data:
          graphUnclaimedPayouts && graphUnclaimedPayouts[0].length > 0
            ? graphUnclaimedPayouts[0].map((item: AnyApi) => item.amount)
            : graphUnclaimedPayouts.map((item: AnyApi) => item.amount),
        label: t('unclaimedPayouts'),
        borderColor: colorPayouts,
        backgroundColor: getThemeValue('--accent-color-pending'),
        pointRadius: 0,
        borderRadius,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.5,
    maxBarThickness: 15,
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
          color: graphColors.grid[mode],
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
        backgroundColor: graphColors.tooltip[mode],
        titleColor: graphColors.label[mode],
        bodyColor: graphColors.label[mode],
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
      <Bar options={options} data={data} />
    </div>
  )
}
