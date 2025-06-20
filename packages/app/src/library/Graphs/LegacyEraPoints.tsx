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
import { useTheme } from 'contexts/Themes'
import { useThemeValues } from 'contexts/ThemeValues'
import { Line } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import graphColors from 'styles/graphs/index.json'
import type { AnyJson, PointsByEra } from 'types'
import { Spinner } from 'ui-core/base'

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

export const LegacyEraPoints = ({
  pointsByEra,
  syncing,
  width,
  height,
}: {
  pointsByEra: PointsByEra
  syncing: boolean
  width: string | number
  height: string | number
}) => {
  const { t } = useTranslation()
  const { mode } = useTheme()
  const { getThemeValue } = useThemeValues()

  // Format reward points as an array of strings, or an empty array if syncing
  const dataset = syncing
    ? []
    : Object.values(
        Object.fromEntries(
          Object.entries(pointsByEra).map(([k, v]) => [
            k,
            new BigNumber(v).toString(),
          ])
        )
      )

  // Format labels, only displaying the first and last era
  const labels = Object.keys(pointsByEra).map(() => '')
  const firstEra = Object.keys(pointsByEra)[0]
  labels[0] = firstEra
    ? `${t('era', { ns: 'app' })} ${Object.keys(pointsByEra)[0]}`
    : ''
  const lastEra = Object.keys(pointsByEra)[labels.length - 1]
  labels[labels.length - 1] = lastEra
    ? `${t('era', { ns: 'app' })} ${Object.keys(pointsByEra)[labels.length - 1]}`
    : ''

  // Use primary color for line
  const color = getThemeValue('--accent-color-primary')

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.3,
    maxBarThickness: 13,
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: getThemeValue('--grid-canvas-axis'),
          font: {
            size: 10,
          },
          autoSkip: true,
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: getThemeValue('--grid-canvas-axis'),
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
        grid: {
          color: getThemeValue('--grid-canvas'),
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
            `${new BigNumber(context.parsed.y).decimalPlaces(0).toFormat()} ${t('eraPoints', { ns: 'app' })}`,
        },
        intersect: false,
        interaction: {
          mode: 'nearest',
        },
      },
    },
  }

  const data = {
    labels,
    datasets: [
      {
        label: t('era', { ns: 'app' }),
        data: dataset,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 0,
        borderRadius: 3,
      },
    ],
  }

  return (
    <div
      className="inner"
      style={{
        width,
        height,
        position: 'relative',
      }}
    >
      <Line options={options} data={data} />
      {syncing && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <Spinner />
        </div>
      )}
    </div>
  )
}
