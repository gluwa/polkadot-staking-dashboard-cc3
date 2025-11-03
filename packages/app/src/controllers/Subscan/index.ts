// Copyright 2024 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { NetworkList } from 'consts/networks'
import type { Locale } from 'date-fns'
import { format, fromUnixTime, getUnixTime, subDays } from 'date-fns'
import { poolMembersPerPage } from 'library/List/defaults'
import type { PoolMember } from 'types'
import type {
  SubscanData,
  SubscanEraPoints,
  SubscanPayout,
  SubscanPoolClaim,
  SubscanPoolMember,
  SubscanRequestBody,
} from './types'

export class Subscan {
  // List of endpoints to be used for Subscan API calls.
  static ENDPOINTS = {
    eraStat: '/api/scan/staking/era_stat',
    poolMembers: '/api/scan/nomination_pool/pool/members',
    poolRewards: '/api/scan/nomination_pool/rewards',
    rewardSlash: '/api/v2/scan/account/reward_slash',
  }

  static ApiSubscanKey = 'd37149339f64775155a82a53f4253b27'

  // Total amount of requests that can be made in 1 second.
  static TOTAL_REQUESTS_PER_SECOND = 5

  // Maximum amount of payout days supported.
  static MAX_PAYOUT_DAYS = 60

  // Request queue and rate limiting
  private static requestQueue: Array<() => Promise<unknown>> = []
  private static isProcessingQueue = false
  private static lastRequestTime = 0

  // Type guard for API responses
  private static hasListProperty(result: unknown): result is { list: unknown } {
    return typeof result === 'object' && result !== null && 'list' in result
  }

  // The network to use for Subscan API calls.
  static network: string

  // Subscan payout data, keyed by address.
  static payoutData: Record<string, SubscanData> = {}

  // Subscan pool data, keyed by `<network>-<poolId>-<key1>-<key2>...`.
  static poolData: Record<string, PoolMember[]> = {}

  // Subscan era points data, keyed by `<network>-<address>-<era>`.
  static eraPointsData: Record<string, SubscanEraPoints[]> = {}

  // Set the network to use for Subscan API calls.
  //
  // Effects the endpoint being used. Should be updated on network change in the UI.
  set network(network: string) {
    Subscan.network = network
  }

  // Handle fetching the various types of payout and set state in one render.
  static handleFetchPayouts = async (address: string): Promise<void> => {
    try {
      if (!this.payoutData[address]) {
        const results = await Promise.all([
          this.fetchNominatorPayouts(address),
          this.fetchPoolClaims(address),
        ])
        const { payouts, unclaimedPayouts } = results[0]
        const poolClaims = results[1]

        // Persist results to class.
        this.payoutData[address] = {
          payouts,
          unclaimedPayouts,
          poolClaims,
        }

        document.dispatchEvent(
          new CustomEvent('subscan-data-updated', {
            detail: {
              keys: ['payouts', 'unclaimedPayouts', 'poolClaims'],
            },
          })
        )
      }
    } catch (e) {
      // Silently fail request.
    }
  }

  // Fetch nominator payouts from Subscan. NOTE: Payouts with a `block_timestamp` of 0 are
  // unclaimed.
  static fetchNominatorPayouts = async (
    address: string
  ): Promise<{
    payouts: SubscanPayout[]
    unclaimedPayouts: SubscanPayout[]
  }> => {
    try {
      const result = await this.makeRequest(this.ENDPOINTS.rewardSlash, {
        address,
        is_stash: true,
        row: 100,
        page: 0,
      })

      if (!result || !this.hasListProperty(result) || !result.list) {
        return { payouts: [], unclaimedPayouts: [] }
      }

      const resultList = result.list as SubscanPayout[]
      const payouts =
        resultList.filter(
          ({ block_timestamp }: SubscanPayout) => block_timestamp !== 0
        ) || []

      let unclaimedPayouts =
        resultList.filter((l: SubscanPayout) => l.block_timestamp === 0) || []

      // Further filter unclaimed payouts to ensure that payout records of `stash` and
      // `validator_stash` are not repeated for an era. NOTE: This was introduced to remove errornous
      // data where there were duplicated payout records (with different amounts) for a stash -
      // validator - era record. from Subscan.
      unclaimedPayouts = unclaimedPayouts.filter(
        (u: SubscanPayout) =>
          !payouts.find(
            (p: SubscanPayout) =>
              p.stash === u.stash &&
              p.validator_stash === u.validator_stash &&
              p.era === u.era
          )
      )

      return { payouts, unclaimedPayouts }
    } catch (e) {
      console.warn('Failed to fetch nominator payouts:', e)
      return { payouts: [], unclaimedPayouts: [] }
    }
  }

  // Fetch pool claims from Subscan, ensuring no payouts have block_timestamp of 0.
  static fetchPoolClaims = async (
    address: string
  ): Promise<SubscanPoolClaim[]> => {
    try {
      const result = await this.makeRequest(this.ENDPOINTS.poolRewards, {
        address,
        row: 100,
        page: 0,
      })

      if (!result || !this.hasListProperty(result) || !result.list) {
        return []
      }

      // Remove claims with a `block_timestamp` of 0.
      const resultList = result.list as SubscanPoolClaim[]
      const poolClaims = resultList.filter(
        (l: SubscanPoolClaim) => l.block_timestamp !== 0
      )
      return poolClaims
    } catch (e) {
      console.warn('Failed to fetch pool claims:', e)
      return []
    }
  }

  // Fetch a page of pool members from Subscan.
  static fetchPoolMembers = async (
    poolId: number,
    page: number
  ): Promise<PoolMember[]> => {
    try {
      const result = await this.makeRequest(this.ENDPOINTS.poolMembers, {
        pool_id: poolId,
        row: poolMembersPerPage,
        page: page - 1,
      })

      if (!result || !this.hasListProperty(result) || !result.list) {
        return []
      }

      // Format list and return.
      const resultList = result.list as SubscanPoolMember[]
      return resultList
        .map((entry: SubscanPoolMember) => ({
          who: entry.account_display.address,
          poolId: entry.pool_id,
        }))
        .reverse()
        .splice(0, resultList.length - 1)
    } catch (e) {
      console.warn('Failed to fetch pool members:', e)
      return []
    }
  }

  // Fetch a pool's era points from Subscan.
  static fetchEraPoints = async (
    address: string,
    era: number
  ): Promise<SubscanEraPoints[]> => {
    try {
      const result = await this.makeRequest(this.ENDPOINTS.eraStat, {
        page: 0,
        row: 100,
        address,
      })

      if (!result || !this.hasListProperty(result) || !result.list) {
        return []
      }

      // Format list to just contain reward points.
      const resultList = result.list as Array<{
        era: number
        reward_point: number
      }>
      const list = []
      for (let i = era; i > era - 100; i--) {
        list.push({
          era: i,
          reward_point:
            resultList.find(
              ({ era: resultEra }: { era: number }) => resultEra === i
            )?.reward_point ?? 0,
        })
      }
      // Removes last zero item and return.
      return list.reverse().splice(0, list.length - 1)
    } catch (e) {
      console.warn('Failed to fetch era points:', e)
      return []
    }
  }

  // Handle fetching pool members.
  static handleFetchPoolMembers = async (poolId: number, page: number) => {
    const dataKey = `${this.network}-${poolId}-${page}-members}`
    const currentValue = this.poolData[dataKey]

    if (currentValue) {
      return currentValue
    } else {
      const result = await this.fetchPoolMembers(poolId, page)
      this.poolData[dataKey] = result

      return result
    }
  }

  // Handle fetching era point history.
  static handleFetchEraPoints = async (address: string, era: number) => {
    const dataKey = `${this.network}-${address}-${era}}`
    const currentValue = this.eraPointsData[dataKey]

    if (currentValue) {
      return currentValue
    } else {
      const result = await this.fetchEraPoints(address, era)
      this.eraPointsData[dataKey] = result
      return result
    }
  }

  // Resets all received data from class.
  static resetData = () => {
    this.payoutData = {}
  }

  // Remove unclaimed payouts and dispatch update event.
  static removeUnclaimedPayouts = (address: string, eraPayouts: string[]) => {
    const newUnclaimedPayouts = (this.payoutData[address]?.unclaimedPayouts ||
      []) as SubscanPayout[]

    eraPayouts.forEach(([era]) => {
      newUnclaimedPayouts.filter((u) => String(u.era) !== era)
    })
    this.payoutData[address].unclaimedPayouts = newUnclaimedPayouts

    document.dispatchEvent(
      new CustomEvent('subscan-data-updated', {
        detail: {
          keys: ['unclaimedPayouts'],
        },
      })
    )
  }

  // Take non-zero rewards in most-recent order.
  static removeNonZeroAmountAndSort = (payouts: SubscanPayout[]) => {
    const list = payouts
      .filter((p) => Number(p.amount) > 0)
      .sort((a, b) => b.block_timestamp - a.block_timestamp)

    // Calculates from the current date.
    const fromTimestamp = getUnixTime(subDays(new Date(), this.MAX_PAYOUT_DAYS))
    // Ensure payouts not older than `MAX_PAYOUT_DAYS` are returned.
    return list.filter(
      ({ block_timestamp }) => block_timestamp >= fromTimestamp
    )
  }

  // Calculate the earliest date of a payout list.
  static payoutsFromDate = (payouts: SubscanPayout[], locale: Locale) => {
    if (!payouts.length) {
      return undefined
    }
    const filtered = this.removeNonZeroAmountAndSort(payouts || [])
    if (!filtered.length) {
      return undefined
    }
    return format(
      fromUnixTime(filtered[filtered.length - 1].block_timestamp),
      'do MMM',
      {
        locale,
      }
    )
  }

  // Calculate the latest date of a payout list.
  static payoutsToDate = (payouts: SubscanPayout[], locale: Locale) => {
    if (!payouts.length) {
      return undefined
    }
    const filtered = this.removeNonZeroAmountAndSort(payouts || [])
    if (!filtered.length) {
      return undefined
    }

    return format(fromUnixTime(filtered[0].block_timestamp), 'do MMM', {
      locale,
    })
  }

  // Get the public Subscan endpoint.
  static getEndpoint = () => {
    const networkConfig = NetworkList[this.network as keyof typeof NetworkList]
    return (
      networkConfig?.endpoints?.subscan?.api ||
      `https://${this.network}.api.subscan.io`
    )
  }

  static getExplorerUrl = () => {
    const networkConfig = NetworkList[this.network as keyof typeof NetworkList]
    return (
      networkConfig?.endpoints?.subscan?.explorer ||
      `https://${this.network}.subscan.io`
    )
  }

  // Process the request queue with rate limiting
  private static async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return
    }

    this.isProcessingQueue = true

    while (this.requestQueue.length > 0) {
      const now = Date.now()
      const timeSinceLastRequest = now - this.lastRequestTime
      const minInterval = 1000 / this.TOTAL_REQUESTS_PER_SECOND // 200ms between requests

      if (timeSinceLastRequest < minInterval) {
        await new Promise((resolve) =>
          setTimeout(resolve, minInterval - timeSinceLastRequest)
        )
      }

      const request = this.requestQueue.shift()
      if (request) {
        this.lastRequestTime = Date.now()
        await request()
      }
    }

    this.isProcessingQueue = false
  }

  // Make a request to Subscan and return any data returned from the response.
  static makeRequest = async (endpoint: string, body: SubscanRequestBody) =>
    new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const res: Response = await fetch(this.getEndpoint() + endpoint, {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': this.ApiSubscanKey,
            },
            body: JSON.stringify(body),
            method: 'POST',
          })

          if (res.status === 429) {
            // Rate limited - wait longer and retry once
            await new Promise((retryResolve) => setTimeout(retryResolve, 2000))
            const retryRes: Response = await fetch(
              this.getEndpoint() + endpoint,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-Key': this.ApiSubscanKey,
                },
                body: JSON.stringify(body),
                method: 'POST',
              }
            )

            if (retryRes.status === 429) {
              reject(new Error('Rate limited after retry'))
              return
            }

            const retryJson = await retryRes.json()
            resolve(retryJson?.data || undefined)
            return
          }

          if (!res.ok) {
            reject(new Error(`HTTP ${res.status}: ${res.statusText}`))
            return
          }

          const json = await res.json()
          resolve(json?.data || undefined)
        } catch (error) {
          reject(error)
        }
      }

      this.requestQueue.push(request)
      this.processQueue()
    })
}
