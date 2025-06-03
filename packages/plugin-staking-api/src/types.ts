// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type {
  ApolloError,
  ApolloQueryResult,
  OperationVariables,
} from '@apollo/client'

export interface TokenPrice {
  price: number
  change: number
}

export type TokenPriceResult = {
  tokenPrice: TokenPrice
} | null

interface Query {
  loading: boolean
  error: ApolloError | undefined
  refetch: (
    variables?: Partial<OperationVariables> | undefined
  ) => Promise<ApolloQueryResult<unknown>>
}

export type UseTokenPriceResult = Query & {
  data: TokenPriceResult
}

export type ValidatorRewardsResult = Query & {
  data: {
    validatorRewards: ValidatorReward[]
  }
}

export interface ValidatorReward {
  era: number
  reward: string
  start: number
}

export type PoolRewardResults = Query & {
  data: {
    poolRewards: PoolReward[]
  }
}

export type ActiveValidatorRanksResult = Query & {
  data: {
    activeValidatorRanks: ActiveValidatorRank[]
  }
}

export interface ActiveValidatorRank {
  validator: string
  rank: number
}

export type ValidatorEraPointsResult = Query & {
  data: {
    validatorEraPoints: ValidatorEraPoints[]
  }
}

export type ValidatorEraPointsBatchResult = Query & {
  data: {
    validatorEraPointsBatch: ValidatorEraPointsBatch[]
  }
}

export interface ValidatorEraPoints {
  era: number
  points: string
  start: number
}

export interface ValidatorEraPointsBatch {
  validator: string
  points: ValidatorEraPoints[]
}

export interface PoolReward {
  reward: string
  timestamp: number
  who: string
  poolId: number
}

export type PoolEraPointsResult = Query & {
  data: {
    poolEraPoints: PoolEraPoints[]
  }
}

export interface PoolEraPoints {
  era: number
  points: string
  start: number
}

export type PoolCandidatesResult = Query & {
  data: {
    poolCandidates: number[]
  }
}
