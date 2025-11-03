// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { createSafeContext, useEffectIgnoreInitial } from '@w3ux/hooks'
import type { Sync } from '@w3ux/types'
import { shuffle } from '@w3ux/utils'
import BigNumber from 'bignumber.js'
import type { AnyApi } from 'common-types'
import { MaxEraRewardPointsEras } from 'consts'
import { useApi } from 'contexts/Api'
import { useNetwork } from 'contexts/Network'
import { useStaking } from 'contexts/Staking'
import type { PalletStakingEraRewardPoints } from 'dedot/chaintypes'
import {
  getValidatorRank as getValidatorRankBus,
  getValidatorRanks,
} from 'global-bus'
import { useErasPerDay } from 'hooks/useErasPerDay'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import type {
  IdentityOf,
  SuperIdentity,
  Validator,
  ValidatorStatus,
} from 'types'
import { formatIdentities, perbillToPercent } from 'utils'
import type {
  EraPointsBoundaries,
  EraRewardPoints,
  ErasRewardPoints,
  ValidatorAddresses,
  ValidatorEraPointHistory,
  ValidatorListEntry,
  Validators,
  ValidatorsContextInterface,
} from '../types'
import { getLocalEraValidators, setLocalEraValidators } from '../Utils'
import {
  defaultAverageEraValidatorReward,
  defaultEraPointsBoundaries,
  defaultValidatorsData,
} from './defaults'

export const [ValidatorsContext, useValidators] =
  createSafeContext<ValidatorsContextInterface>()

export const ValidatorsProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useNetwork()
  const { activeEra } = useApi()
  const { stakers } = useStaking().eraStakers
  const { erasPerDay, maxSupportedDays } = useErasPerDay()
  const { isReady, getConsts, serviceApi } = useApi()
  const { historyDepth } = getConsts(network)

  // Store validator entries and sync status
  const [validators, setValidators] = useState<Validators>({
    status: 'unsynced',
    validators: [],
  })
  // Setter for validator status
  const setValidatorsFetched = (status: Sync) =>
    setValidators({ ...validators, status })

  // Getter for validator entries
  const getValidators = () => validators.validators

  // Store validator identity data
  const [validatorIdentities, setValidatorIdentities] = useState<
    Record<string, IdentityOf>
  >({})

  // Store validator super identity data
  const [validatorSupers, setValidatorSupers] = useState<
    Record<string, SuperIdentity>
  >({})

  // Stores the currently active validator set
  const [sessionValidators, setSessionValidators] = useState<string[]>([])

  // Stores the average network commission rate
  const [avgCommission, setAvgCommission] = useState<number>(0)

  // Track whether the validator list has been fetched
  const [erasRewardPointsFetched, setErasRewawrdPointsFetched] =
    useState<Sync>('unsynced')

  // Store era reward points, keyed by era
  const [erasRewardPoints, setErasRewardPoints] = useState<ErasRewardPoints>({})

  // Store validator era points history and metrics
  const [validatorEraPointsHistory, setValidatorEraPointsHistory] = useState<
    Record<string, ValidatorEraPointHistory>
  >({})

  // Store era point high and low for `MaxEraPointsEras` eras
  const [eraPointsBoundaries, setEraPointsBoundaries] =
    useState<EraPointsBoundaries>(defaultEraPointsBoundaries)

  // Average rerward rate
  const [averageEraValidatorReward, setAverageEraValidatorReward] = useState<{
    days: number
    reward: BigNumber
  }>(defaultAverageEraValidatorReward)

  // Processes reward points for a given era
  const processEraRewardPoints = (
    result: PalletStakingEraRewardPoints | undefined,
    era: BigNumber
  ): EraRewardPoints => {
    const eraKey = era.toString()

    if (!result) {
      return erasRewardPoints[eraKey]
    }

    if (erasRewardPoints[eraKey]) {
      return erasRewardPoints[eraKey]
    }

    const individual: Record<string, string> = Object.fromEntries(
      result.individual.map(([accountId, points]) => [
        accountId.address(),
        points.toString(),
      ])
    )

    return {
      total: result.total.toString(),
      individual,
    }
  }

  // Get quartile data for validator performance data
  const getQuartile = (qIndex: number, total: number) => {
    const q1 = Math.ceil(total * 0.25)
    const q2 = Math.ceil(total * 0.5)
    const q3 = Math.ceil(total * 0.75)

    if (qIndex <= q1) {
      return 25
    }
    if (qIndex <= q2) {
      return 50
    }
    if (qIndex <= q3) {
      return 75
    }
    return 100
  }

  // Fetches era reward points for eligible eras
  const fetchErasRewardPoints = async () => {
    if (
      !isReady ||
      activeEra.index === 0 ||
      erasRewardPointsFetched !== 'unsynced'
    ) {
      return
    }

    setErasRewawrdPointsFetched('syncing')

    // start fetching from the current era
    let currentEra = BigNumber.max(activeEra.index - 1, 1)
    const endEra = BigNumber.max(activeEra.index - MaxEraRewardPointsEras, 1)

    // Introduce additional safeguard againt looping forever
    const totalEras = new BigNumber(MaxEraRewardPointsEras)
    let erasProcessed = new BigNumber(0)

    // Iterate eras and process reward points
    const eras = []
    do {
      eras.push(currentEra)
      currentEra = currentEra.minus(1)
      erasProcessed = erasProcessed.plus(1)
    } while (
      currentEra.isGreaterThanOrEqualTo(endEra) &&
      erasProcessed.isLessThan(totalEras)
    )

    const results = await serviceApi.query.erasRewardPointsMulti(
      eras.map((e) => Number(e))
    )

    // Make calls and format reward point results
    const newErasRewardPoints: ErasRewardPoints = {}
    let i = 0
    for (const result of results) {
      const formatted = processEraRewardPoints(result, eras[i])
      if (formatted) {
        newErasRewardPoints[eras[i].toString()] = formatted
      }
      i++
    }

    let newEraPointsHistory: Record<string, ValidatorEraPointHistory> = {}

    // Calculate points per era and total points per era of each validator
    Object.entries(newErasRewardPoints).forEach(([era, { individual }]) => {
      Object.entries(individual).forEach(([address, points]) => {
        if (!newEraPointsHistory[address]) {
          newEraPointsHistory[address] = {
            eras: {},
            totalPoints: new BigNumber(0),
          }
        } else {
          newEraPointsHistory[address].eras[era] = new BigNumber(points)
          newEraPointsHistory[address].totalPoints =
            newEraPointsHistory[address].totalPoints.plus(points)
        }
      })
    })

    // Iterate `newEraPointsHistory` and re-order the object based on its totalPoints, highest
    // first
    newEraPointsHistory = Object.fromEntries(
      Object.entries(newEraPointsHistory)
        .sort(
          (
            a: [string, ValidatorEraPointHistory],
            b: [string, ValidatorEraPointHistory]
          ) => a[1].totalPoints.minus(b[1].totalPoints).toNumber()
        )
        .reverse()
    )

    const totalEntries = Object.entries(newEraPointsHistory).length
    let j = 0
    newEraPointsHistory = Object.fromEntries(
      Object.entries(newEraPointsHistory).map(([k, v]) => {
        j++
        return [k, { ...v, rank: j, quartile: getQuartile(j, totalEntries) }]
      })
    )

    // Commit results to state
    setErasRewardPoints({
      ...newErasRewardPoints,
    })
    setValidatorEraPointsHistory(newEraPointsHistory)
  }

  // Fetch validator entries and format the returning data
  const getValidatorEntries = async () => {
    if (!isReady) {
      return defaultValidatorsData
    }

    let result
    try {
      result = await serviceApi.query.validatorEntries()
    } catch (error) {
      console.error('Error fetching validator entries:', error)
      return defaultValidatorsData
    }

    const entries: Validator[] = []
    let notFullCommissionCount = 0
    let totalNonAllCommission = new BigNumber(0)
    result.forEach(([address, { commission, blocked }]) => {
      const commissionAsPercent = perbillToPercent(commission)

      if (!commissionAsPercent.isEqualTo(100)) {
        totalNonAllCommission = totalNonAllCommission.plus(commissionAsPercent)
        notFullCommissionCount++
      }

      entries.push({
        address,
        prefs: {
          commission: Number(commissionAsPercent.toFixed(2)),
          blocked,
        },
      })
    })

    return { entries, notFullCommissionCount, totalNonAllCommission }
  }

  // Fetch validator super accounts and their identities
  const fetchValidatorSupers = async (addresses: string[]) => {
    if (!isReady || !addresses.length) {
      return {}
    }

    try {
      // Get super accounts for each address
      const supersRaw = await serviceApi.query.superOfMulti(addresses)

      const supers = Object.fromEntries(
        Object.entries(
          Object.fromEntries(
            supersRaw.map((k, i) => [
              addresses[i],
              {
                superOf: k,
              },
            ])
          )
        ).filter(([, { superOf }]) => superOf !== undefined)
      )

      const superIdentities = (
        await serviceApi.query.identityOfMulti(
          Object.values(supers).map(({ superOf }) => {
            if (superOf && Array.isArray(superOf) && superOf[0]) {
              // Handle AccountId32 object
              const accountId = superOf[0]
              return accountId.address ? accountId.address() : String(accountId)
            }
            return ''
          })
        )
      ).map((superIdentity) => superIdentity)

      const supersWithIdentity = Object.fromEntries(
        Object.entries(supers).map(([k, v]: AnyApi, i) => [
          k,
          {
            ...v,
            identity: superIdentities[i],
          },
        ])
      )
      return supersWithIdentity
    } catch (error) {
      console.error('Error fetching validator supers:', error)
      return {}
    }
  }

  // Fetches identity data for a list of validator addresses
  const fetchValidatorIdentities = async (addresses: string[]) => {
    if (!isReady || !addresses.length) {
      return
    }

    try {
      // Fetch identities and super identities in parallel
      const [identities, supersWithIdentity] = await Promise.all([
        serviceApi.query.identityOfMulti(addresses),
        fetchValidatorSupers(addresses),
      ])

      // Format the results
      const formattedIdentities = formatIdentities(addresses, identities)

      // Filter out undefined values to match the expected type
      const validIdentities = Object.fromEntries(
        Object.entries(formattedIdentities).filter(
          ([, value]) => value !== undefined
        )
      ) as Record<string, IdentityOf>

      // Update state
      setValidatorIdentities((prev) => ({ ...prev, ...validIdentities }))
      setValidatorSupers((prev) => ({ ...prev, ...supersWithIdentity }))
    } catch (error) {
      console.error('Error fetching validator identities:', error)
    }
  }

  // Fetches and formats the active validator set, and derives metrics from the result
  const fetchValidators = async () => {
    if (!isReady) {
      return
    }

    // If already syncing, don't start another sync
    if (validators.status === 'syncing') {
      return
    }

    setValidatorsFetched('syncing')

    // If local validator entries exist for the current era, store these values in state. Otherwise,
    // fetch entries from API
    const localEraValidators = getLocalEraValidators(
      network,
      activeEra.index.toString()
    )

    // The validator entries for the current active era
    let validatorEntries: Validator[] = []
    // Average network commission for all non 100% commissioned validators
    let avg = 0

    if (localEraValidators) {
      validatorEntries = localEraValidators.entries
      avg = localEraValidators.avgCommission
    } else {
      const { entries, notFullCommissionCount, totalNonAllCommission } =
        await getValidatorEntries()

      validatorEntries = entries
      avg = notFullCommissionCount
        ? totalNonAllCommission
            .dividedBy(notFullCommissionCount)
            .decimalPlaces(2)
            .toNumber()
        : 0
    }

    // Set entries data for the era to local storage
    setLocalEraValidators(
      network,
      activeEra.index.toString(),
      validatorEntries,
      avg
    )
    setAvgCommission(avg)
    // NOTE: validators are shuffled before committed to state
    setValidators({ status: 'synced', validators: shuffle(validatorEntries) })

    // Fetch identity data for all validators
    const validatorAddresses = validatorEntries.map((v) => v.address)
    await fetchValidatorIdentities(validatorAddresses)
  }

  // Subscribe to active session validators
  const fetchSessionValidators = async () => {
    if (!isReady) {
      return
    }
    const result = await serviceApi.query.sessionValidators()
    setSessionValidators(result)

    // Fetch identity data for session validators
    await fetchValidatorIdentities(result)
  }

  // Gets era points for a validator
  const getValidatorPointsFromEras = (startEra: BigNumber, address: string) => {
    startEra = BigNumber.max(startEra, 1)

    // minus 1 from `MaxRewardPointsEras` to account for the current era.
    const endEra = BigNumber.max(startEra.minus(MaxEraRewardPointsEras - 1), 1)

    const points: Record<string, BigNumber> = {}
    let currentEra = startEra
    do {
      const eraPoints = erasRewardPoints[currentEra.toString()]
      if (eraPoints) {
        const validatorPoints = eraPoints.individual[address]
        points[currentEra.toString()] = new BigNumber(validatorPoints || 0)
      } else {
        points[currentEra.toString()] = new BigNumber(0)
      }
      currentEra = currentEra.minus(1)
    } while (currentEra.isGreaterThanOrEqualTo(endEra))

    return points
  }

  // Fetches prefs for a list of validators
  const fetchValidatorPrefs = async (addresses: ValidatorAddresses) => {
    if (!addresses.length) {
      return null
    }

    const v: string[] = []
    const vMulti: string[] = []
    for (const { address } of addresses) {
      v.push(address)
      vMulti.push(address)
    }

    const resultsMulti = await serviceApi.query.validatorsMulti(vMulti)
    const formatted: Validator[] = []
    for (let i = 0; i < resultsMulti.length; i++) {
      const prefs = resultsMulti[i]

      if (prefs) {
        formatted.push({
          address: v[i],
          prefs: {
            commission: Number(perbillToPercent(prefs.commission).toString()),
            blocked: prefs.blocked,
          },
        })
      }
    }
    return formatted
  }

  // Formats a list of addresses with validator preferences
  const formatWithPrefs = (addresses: string[]) =>
    addresses.map((address) => ({
      address,
      prefs: getValidators().find((v) => v.address === address)?.prefs || {
        blocked: false,
        commission: 0,
      },
    }))

  // Inject status into validator entries
  const injectValidatorListData = (
    entries: Validator[]
  ): ValidatorListEntry[] => {
    const injected: ValidatorListEntry[] =
      entries.map((entry) => {
        const inSession = sessionValidators.includes(entry.address)

        let validatorStatus: ValidatorStatus = 'waiting'
        if (inSession) {
          validatorStatus = 'active'
        }
        return {
          ...entry,
          validatorStatus,
        }
      }) || []

    return injected
  }

  // Gets a validator's total stake, if any
  const getValidatorTotalStake = (address: string): bigint => {
    const entry = getValidators().find((v) => v.address === address)
    if (!entry) {
      return 0n
    }
    const inEra = stakers.find((staker) => staker.address === entry.address)
    if (!inEra) {
      return 0n
    }

    // Use the total directly from the validator data, which comes from the chain
    // This ensures we get the correct total even if we're missing some nominator data
    return BigInt(inEra.total)
  }

  // Gets average validator reward for provided number of days
  const getAverageEraValidatorReward = async () => {
    if (!isReady || activeEra.index === 0) {
      setAverageEraValidatorReward({
        days: 0,
        reward: new BigNumber(0),
      })
      return
    }

    // If max supported days is less than 30, use 15 day average instead
    const days = maxSupportedDays > 30 ? 30 : 15

    // Calculates the number of eras required to calculate required `days`, not surpassing
    // historyDepth
    const endEra = Math.max(
      activeEra.index - erasPerDay * days,
      Math.max(0, activeEra.index - historyDepth)
    )

    const eras: string[] = []
    let thisEra = activeEra.index - 1
    do {
      eras.push(thisEra.toString())
      thisEra = thisEra - 1
    } while (thisEra >= endEra)

    const results = await serviceApi.query.erasValidatorRewardMulti(
      eras.map((e) => Number(e))
    )

    const reward = results
      .map((v) => {
        const value = new BigNumber(v || 0)
        if (value.isNaN()) {
          return new BigNumber(0)
        }
        return value
      })
      .reduce((prev, current) => prev.plus(current), new BigNumber(0))
      .div(eras.length)

    setAverageEraValidatorReward({ days, reward })
  }

  // Gets the highest and lowest (non-zero) era points earned `MaxEraRewardPointsEras` timeframe
  const calculateEraPointsBoundaries = () => {
    let high: BigNumber | null = null
    let low: BigNumber | null = null

    Object.entries(erasRewardPoints).forEach(([, { individual }]) => {
      for (const [, points] of Object.entries(individual)) {
        const p = new BigNumber(points)

        if (p.isGreaterThan(high || 0)) {
          high = p
        }
        if (low === null) {
          low = p
        } else if (p.isLessThan(low) && !p.isZero()) {
          low = p
        }
      }
    })

    setEraPointsBoundaries({
      high: high || new BigNumber(0),
      low: low || new BigNumber(0),
    })
    setErasRewawrdPointsFetched('synced')
  }

  const getValidatorRank = (validator: string): number | undefined => {
    const rank = getValidatorRankBus(validator)
    if (!rank) {
      return undefined
    }
    return rank
  }

  const getValidatorRankSegment = (validator: string): number => {
    const fallbackSegment = 100
    const rank = getValidatorRankBus(validator)
    if (!rank) {
      return fallbackSegment
    }
    const percentile = (rank / getValidatorRanks().length) * 100
    const segment = Math.ceil(percentile / 10) * 10
    return segment
  }

  // Reset validator state data on network change
  useEffectIgnoreInitial(() => {
    setValidators({
      status: 'unsynced',
      validators: [],
    })
    setSessionValidators([])
    setAvgCommission(0)
    setValidatorIdentities({})
    setValidatorSupers({})
    setAverageEraValidatorReward(defaultAverageEraValidatorReward)
  }, [network])

  // Fetch validators and era reward points when fetched status changes
  useEffect(() => {
    if (isReady && activeEra.index > 0) {
      fetchValidators()
      fetchErasRewardPoints()
    }
  }, [validators.status, erasRewardPointsFetched, isReady, activeEra])

  // Mark unsynced and fetch session validators and average reward when activeEra changes
  useEffectIgnoreInitial(() => {
    if (isReady && activeEra.index > 0) {
      if (erasRewardPointsFetched === 'synced') {
        setErasRewawrdPointsFetched('unsynced')
      }

      if (validators.status === 'synced') {
        setValidatorsFetched('unsynced')
      }
      fetchSessionValidators()
      getAverageEraValidatorReward()
    }
  }, [isReady, activeEra])

  // Fetch era points boundaries when `erasRewardPoints` ready
  useEffectIgnoreInitial(() => {
    if (isReady && Object.values(erasRewardPoints).length) {
      calculateEraPointsBoundaries()
    }
  }, [isReady, erasRewardPoints])
  return (
    <ValidatorsContext.Provider
      value={{
        fetchValidatorPrefs,
        getValidatorPointsFromEras,
        injectValidatorListData,
        getValidators,
        validatorIdentities,
        validatorSupers,
        avgCommission,
        sessionValidators,
        validatorsFetched: validators.status,
        erasRewardPoints,
        eraPointsBoundaries,
        validatorEraPointsHistory,
        erasRewardPointsFetched,
        averageEraValidatorReward,
        formatWithPrefs,
        getValidatorTotalStake,
        getValidatorRank,
        getValidatorRankSegment,
      }}
    >
      {children}
    </ValidatorsContext.Provider>
  )
}
