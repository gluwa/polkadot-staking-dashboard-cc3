// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import BigNumber from 'bignumber.js'
import type { AnyApi } from 'common-types'
import { MaxPayoutDays } from 'consts'
import {
  addDays,
  differenceInDays,
  fromUnixTime,
  getUnixTime,
  isSameDay,
  startOfDay,
  subDays,
} from 'date-fns'
import type { AnyJson } from 'types'
import { planckToUnitBn } from 'utils'
import type { PayoutDayCursor } from './types'

// Given payouts, calculate daily income and fill missing days with zero rewards
export const calculateDailyPayouts = (
  payouts: AnyApi,
  fromDate: Date,
  maxDays: number,
  units: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subject: 'pools' | 'nominate'
) => {
  let dailyPayouts: AnyApi[] = []

  // Remove days that are beyond end day limit
  payouts = payouts.filter(
    (p: AnyApi) =>
      daysPassed(fromUnixTime(p.block_timestamp), fromDate) <= maxDays
  )

  // Return now if no payouts
  if (!payouts.length) {
    return payouts
  }

  // Post-fill any missing days. [current day -> last payout]
  dailyPayouts = postFillMissingDays(payouts, fromDate, maxDays)

  // Start iterating payouts, most recent first
  //
  // Payouts passed
  let p = 0
  // Current day cursor
  let curDay: Date = fromDate
  // Current payout cursor
  let curPayout: PayoutDayCursor = {
    amount: new BigNumber(0),
    event_id: '',
  }
  for (const payout of payouts) {
    p++

    // Extract day from current payout
    const thisDay = startOfDay(fromUnixTime(payout.block_timestamp))

    // Initialise current day if first payout
    if (p === 1) {
      curDay = thisDay
    }

    // Handle surpassed maximum days
    if (daysPassed(thisDay, fromDate) >= maxDays) {
      dailyPayouts.push({
        amount: planckToUnitBn(curPayout.amount, units),
        event_id: getEventId(curPayout),
        block_timestamp: getUnixTime(curDay),
      })
      break
    }

    // get day difference between cursor and current payout
    const daysDiff = daysPassed(thisDay, curDay)

    // Handle new day
    if (daysDiff > 0) {
      // Add current payout cursor to dailyPayouts
      dailyPayouts.push({
        amount: planckToUnitBn(curPayout.amount, units),
        event_id: getEventId(curPayout),
        block_timestamp: getUnixTime(curDay),
      })

      // Update day cursor to the new day
      curDay = thisDay
      // Reset current payout cursor for the new day
      curPayout = {
        amount: new BigNumber(payout.amount),
        event_id: new BigNumber(payout.amount).isLessThan(0)
          ? 'Slash'
          : 'Reward',
      }
    } else {
      // in same day. Aadd payout reward to current payout cursor
      curPayout.amount = curPayout.amount.plus(new BigNumber(payout.amount))
    }

    // If only 1 payout exists, or at the last unresolved payout, exit here
    if (
      payouts.length === 1 ||
      (p === payouts.length && !curPayout.amount.isZero())
    ) {
      dailyPayouts.push({
        amount: planckToUnitBn(curPayout.amount, units),
        event_id: getEventId(curPayout),
        block_timestamp: getUnixTime(curDay),
      })
      break
    }
  }

  // Return payout rewards as plain numbers
  const result: AnyApi[] = []
  for (const payout of dailyPayouts) {
    result.push({
      amount: payout.amount.toString(),
      block_timestamp: payout.block_timestamp,
    })
  }

  return result
}

// Calculate average payouts per day
export const calculatePayoutAverages = (
  payouts: AnyJson,
  fromDate: Date,
  days: number,
  avgDays: number
) => {
  // If we don't need to take an average, just return `payouts`
  if (avgDays <= 1) {
    return payouts
  }

  // create moving average value over `avgDays` past days, if any.
  let payoutsAverages = []
  for (let i = 0; i < payouts.length; i++) {
    // Average period end.
    const end = Math.max(0, i - avgDays)

    // The total amount earned in period
    let total = 0
    // period length to be determined
    let num = 0

    for (let j = i; j >= end; j--) {
      if (payouts[j]) {
        total += Number(payouts[j].amount)
      }
      // Increase by one to treat non-existent as zero value
      num += 1
    }

    if (total === 0) {
      total = Number(payouts[i].amount)
    }

    payoutsAverages.push({
      amount: total / num,
      block_timestamp: payouts[i].block_timestamp,
    })
  }

  // Return an array with the expected number of items
  payoutsAverages = payoutsAverages.filter(
    (p) => daysPassed(fromUnixTime(p.block_timestamp), fromDate) <= days
  )

  return payoutsAverages
}

// Fetch rewards and graph meta data
//
// Format provided payouts and returns the last payment
export const formatRewardsForGraphs = (
  fromDate: Date,
  days: number,
  units: number,
  payouts: AnyApi,
  poolClaims: AnyApi,
  unclaimedPayouts: AnyApi
) => {
  // Set the from date to the start of the next day
  fromDate.setDate(fromDate.getDate() + 1)
  fromDate.setHours(0, 0, 0, 0)

  // Process nominator payouts
  const allPayouts = processPayouts(payouts, fromDate, days, units, 'nominate')

  // Process unclaimed nominator payouts.
  const allUnclaimedPayouts = processPayouts(
    unclaimedPayouts,
    fromDate,
    days,
    units,
    'nominate'
  )

  // Process pool claims
  const allPoolClaims = processPayouts(
    poolClaims,
    fromDate,
    days,
    units,
    'pools'
  )

  return {
    // Reverse rewards: most recent last
    allPayouts,
    allUnclaimedPayouts,
    allPoolClaims,
    lastReward: getLatestReward(payouts, poolClaims),
  }
}
// Process payouts
//
// Calls the relevant functions on raw payouts to format them correctly
const processPayouts = (
  payouts: AnyApi,
  fromDate: Date,
  days: number,
  units: number,
  subject: 'pools' | 'nominate'
) => {
  // Normalise payout timestamps.
  const normalised = normalisePayouts(payouts)

  // Calculate payouts per day from the current day
  let p = calculateDailyPayouts(normalised, fromDate, days, units, subject)
  // Pre-fill payouts if max days have not been reached
  p = p.concat(prefillMissingDays(p, fromDate, days))
  // Fill in gap days between payouts with zero values
  p = fillGapDays(p, fromDate)
  // Reverse payouts: most recent last
  p = p.reverse()

  // Use normalised payouts for calculating the 10-day average prior to the start of the payout
  // graph
  const avgDays = 10
  const preNormalised = getPreMaxDaysPayouts(
    normalised,
    fromDate,
    days,
    avgDays
  )
  // Start of average calculation should be the earliest date
  const averageFromDate = subDays(fromDate, MaxPayoutDays)

  let a = calculateDailyPayouts(
    preNormalised,
    averageFromDate,
    avgDays,
    units,
    subject
  )
  // Prefill payouts if we are missing the earlier dates
  a = a.concat(prefillMissingDays(a, averageFromDate, avgDays))
  // Fill in gap days between payouts with zero values
  a = fillGapDays(a, averageFromDate)
  // Reverse payouts: most recent last
  a = a.reverse()

  return { p, a }
}

// Get payout average in `avgDays` day period after to `days` threshold
//
// These payouts are used for calculating the `avgDays`-day average prior to the start of the payout
// graph
const getPreMaxDaysPayouts = (
  payouts: AnyApi,
  fromDate: Date,
  days: number,
  avgDays: number
) =>
  // Remove payouts that are not within `avgDays` `days` pre-graph window
  payouts.filter(
    (p: AnyApi) =>
      daysPassed(fromUnixTime(p.block_timestamp), fromDate) > days &&
      daysPassed(fromUnixTime(p.block_timestamp), fromDate) <= days + avgDays
  )
// Combine payouts and pool claims
//
// Combines payouts and pool claims into daily records
export const combineRewards = (payouts: AnyApi[], poolClaims: AnyApi[]) => {
  // we first check if actual payouts exist, e.g. there are non-zero payout
  // amounts present in either payouts or pool claims.
  const poolClaimExists = poolClaims.find((p) => Number(p.amount) > 0) || null
  const payoutExists = payouts.find((p) => Number(p.amount) > 0) || null

  // if no pool claims exist but payouts do, return payouts w.o. event_id
  // also do this if there are no payouts period.
  if (
    (!poolClaimExists && payoutExists) ||
    (!payoutExists && !poolClaimExists)
  ) {
    return payouts.map((p) => ({
      amount: p.amount,
      block_timestamp: p.block_timestamp,
    }))
  }

  // If no payouts exist but pool claims do, return pool claims w.o. event_id
  if (!payoutExists && poolClaimExists) {
    return poolClaims.map((p) => ({
      amount: p.amount,
      block_timestamp: p.block_timestamp,
    }))
  }

  // We now know pool claims *and* payouts exist
  //
  // Now determine which dates to display
  let payoutDays: AnyJson[] = []
  // Prefill `dates` with all pool claim and payout days
  poolClaims.forEach((p) => {
    const dayStart = getUnixTime(startOfDay(fromUnixTime(p.block_timestamp)))
    if (!payoutDays.includes(dayStart)) {
      payoutDays.push(dayStart)
    }
  })
  payouts.forEach((p) => {
    const dayStart = getUnixTime(startOfDay(fromUnixTime(p.block_timestamp)))
    if (!payoutDays.includes(dayStart)) {
      payoutDays.push(dayStart)
    }
  })

  // Sort payoutDays by `block_timestamp`
  payoutDays = payoutDays.sort((a, b) => a - b)

  // Iterate payout days.
  //
  // Combine payouts into one unified `rewards` array
  const rewards: AnyApi[] = []

  // Loop pool claims and consume / combine payouts
  payoutDays.forEach((d) => {
    let amount = 0

    // Check payouts exist on this day
    const payoutsThisDay = payouts.filter((p) =>
      isSameDay(fromUnixTime(p.block_timestamp), fromUnixTime(d))
    )
    // Check pool claims exist on this day
    const poolClaimsThisDay = poolClaims.filter((p) =>
      isSameDay(fromUnixTime(p.block_timestamp), fromUnixTime(d))
    )
    // Add amounts
    if (payoutsThisDay.concat(poolClaimsThisDay).length) {
      for (const payout of payoutsThisDay) {
        amount += payout.amount
      }
    }
    rewards.push({
      amount,
      block_timestamp: d,
    })
  })
  return rewards
}

// Get latest reward
//
// Gets the latest reward from pool claims and nominator payouts
export const getLatestReward = (payouts: AnyApi, poolClaims: AnyApi) => {
  // Get most recent payout
  const payoutExists =
    payouts.find((p: AnyApi) => new BigNumber(p.amount).isGreaterThan(0)) ??
    null
  const poolClaimExists =
    poolClaims.find((p: AnyApi) => new BigNumber(p.amount).isGreaterThan(0)) ??
    null

  // Calculate which payout was most recent
  let lastReward = null
  if (!payoutExists || !poolClaimExists) {
    if (payoutExists) {
      lastReward = payoutExists
    }
    if (poolClaimExists) {
      lastReward = poolClaimExists
    }
  } else {
    // Both `payoutExists` and `poolClaimExists` are present
    lastReward =
      payoutExists.block_timestamp > poolClaimExists.block_timestamp
        ? payoutExists
        : poolClaimExists
  }
  return lastReward
}

// Fill in the days from the earliest payout day to `maxDays`
//
// Takes the last (earliest) payout and fills the missing days from that payout day to `maxDays`
export const prefillMissingDays = (
  payouts: AnyApi[],
  fromDate: Date,
  maxDays: number
): AnyApi => {
  const newPayouts = []
  const payoutStartDay = subDays(startOfDay(fromDate), maxDays)
  const payoutEndDay = !payouts.length
    ? startOfDay(fromDate)
    : startOfDay(fromUnixTime(payouts[payouts.length - 1].block_timestamp))

  const daysToPreFill = daysPassed(payoutStartDay, payoutEndDay)

  if (daysToPreFill > 0) {
    for (let i = 1; i < daysToPreFill; i++) {
      newPayouts.push({
        who: '',
        poolId: 0,
        amount: 0,
        event_id: 'Reward',
        block_timestamp: getUnixTime(subDays(payoutEndDay, i)),
      })
    }
  }
  return newPayouts
}

// Fill in the days from the current day to the last payout
//
// Takes the first payout (most recent) and fills the missing days from current day
export const postFillMissingDays = (
  payouts: AnyApi,
  fromDate: Date,
  maxDays: number
): AnyApi => {
  const newPayouts = []
  const payoutsEndDay = startOfDay(fromUnixTime(payouts[0].block_timestamp))
  const daysSinceLast = Math.min(
    daysPassed(payoutsEndDay, startOfDay(fromDate)),
    maxDays
  )

  for (let i = daysSinceLast; i > 0; i--) {
    newPayouts.push({
      who: '',
      poolId: 0,
      amount: 0,
      event_id: 'Reward',
      block_timestamp: getUnixTime(addDays(payoutsEndDay, i)),
    })
  }
  return newPayouts
}

// Fill gap days within payouts with zero amounts
export const fillGapDays = (payouts: AnyApi[], fromDate: Date) => {
  const finalPayouts: AnyApi[] = []

  // Current day cursor
  let curDay = fromDate

  for (const p of payouts) {
    const thisDay = fromUnixTime(p.block_timestamp)
    const gapDays = Math.max(0, daysPassed(thisDay, curDay) - 1)

    if (gapDays > 0) {
      // Add any gap days
      if (gapDays > 0) {
        for (let j = 1; j <= gapDays; j++) {
          finalPayouts.push({
            amount: 0,
            event_id: 'Reward',
            block_timestamp: getUnixTime(subDays(curDay, j)),
          })
        }
      }
    }

    // Add the current day
    finalPayouts.push(p)

    // Day cursor is now the new day
    curDay = thisDay
  }
  return finalPayouts
}

// Utiltiy: normalise payout timestamps to start of day
export const normalisePayouts = (payouts: AnyApi) =>
  payouts.map((p: AnyApi) => ({
    ...p,
    block_timestamp: getUnixTime(startOfDay(fromUnixTime(p.block_timestamp))),
  }))

// Utility: days passed since 2 dates
export const daysPassed = (from: Date, to: Date) =>
  differenceInDays(startOfDay(to), startOfDay(from))

// Utility: extract whether an event id should be a slash or reward, based on the net day amount.
const getEventId = (c: PayoutDayCursor) =>
  c.amount.isLessThan(0) ? 'Slash' : 'Reward'

// Utility: Formats a width and height pair
export const formatSize = (
  {
    width,
    height,
  }: {
    width: string | number
    height: number
  },
  minHeight: number
) => ({
  width: width || '100%',
  height: height || minHeight,
  minHeight,
})
