// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { createSafeContext, useEffectIgnoreInitial } from '@w3ux/hooks'
import { useNetwork } from 'contexts/Network'
import { defaultMeta, fastUnstakeConfig$, fastUnstakeQueue$ } from 'global-bus'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type {
  AnyJson,
  FastUnstakeHead,
  FastUnstakeQueue,
  MaybeAddress,
} from 'types'

import { useStaking } from 'contexts/Staking'
import { validateLocalExposure } from 'contexts/Validators/Utils'

import { setStateWithRef } from '@w3ux/utils'
import { useActiveAccounts } from 'contexts/ActiveAccounts'
import { useApi } from 'contexts/Api'
import { useImportedAccounts } from 'contexts/Connect/ImportedAccounts'
import Worker from 'workers/stakers?worker'
import type {
  FastUnstakeContextInterface,
  LocalMeta,
  MetaInterface,
} from './types'

const worker = new Worker()

export const [FastUnstakeContext, useFastUnstake] =
  createSafeContext<FastUnstakeContextInterface>()

export const FastUnstakeProvider = ({ children }: { children: ReactNode }) => {
  const { network } = useNetwork()
  const { activeAddress } = useActiveAccounts()
  const { getAccount } = useImportedAccounts()
  const { inSetup, fetchEraStakers, isBonding } = useStaking()
  const {
    isReady,
    activeEra,
    stakingMetrics: { erasToCheckPerBlock },
    getConsts,
  } = useApi()

  const { maxExposurePageSize } = getConsts(network)
  const { bondDuration } = getConsts(network)
  // store whether a fast unstake check is in progress
  const [checking, setChecking] = useState<boolean>(false)
  const checkingRef = useRef(checking)

  // store whether the account is exposed for fast unstake
  const [isExposed, setIsExposed] = useState<boolean | null>(null)
  const isExposedRef = useRef(isExposed)

  // store state of elibigility checking
  const [meta, setMeta] = useState<MetaInterface>(defaultMeta)
  const metaRef = useRef(meta)

  // Store fastUnstake queue deposit for user
  const [queueDeposit, setQueueDeposit] = useState<FastUnstakeQueue>()

  // Store fastUnstake head
  const [head, setHead] = useState<FastUnstakeHead | undefined>()

  // Store fastUnstake counter for queue
  const [counterForQueue, setCounterForQueue] = useState<number | undefined>()

  // localStorage key to fetch local metadata
  const getLocalkey = (a: MaybeAddress) => `${network}_fast_unstake_${a}`

  // check until bond duration eras surpasssed
  const checkToEra = activeEra.index - bondDuration

  // Reset state on network change
  useEffect(() => {
    setHead(undefined)
    setCounterForQueue(undefined)
    setStateWithRef(false, setChecking, checkingRef)
    setStateWithRef(null, setIsExposed, isExposedRef)
    setStateWithRef(defaultMeta, setMeta, metaRef)
  }, [network])

  // initiate fast unstake check for accounts that are nominating but not active
  useEffectIgnoreInitial(() => {
    if (
      isReady &&
      getAccount(activeAddress) &&
      !(activeEra.index === 0) &&
      erasToCheckPerBlock > 0 &&
      isBonding()
    ) {
      // get any existing localStorage records for account
      const localMeta: LocalMeta | null = getLocalMeta()

      const initialMeta = localMeta
        ? { checked: localMeta.checked }
        : defaultMeta

      // even if localMeta.isExposed is false, we don't assume a final value until current era +
      // bondDuration is checked
      let initialIsExposed = null
      if (localMeta) {
        if (bondDuration + 1 === localMeta.checked.length) {
          initialIsExposed = localMeta.isExposed
        } else if (localMeta.isExposed === true) {
          initialIsExposed = true
        } else {
          initialIsExposed = null
        }
      }

      // Initial local meta: localMeta
      setStateWithRef(initialMeta, setMeta, metaRef)
      setStateWithRef(initialIsExposed, setIsExposed, isExposedRef)

      // start process if account is inactively nominating & local fast unstake data is not
      // complete
      if (
        getAccount(activeAddress) &&
        !inSetup() &&
        initialIsExposed === null &&
        isBonding()
      ) {
        // if localMeta existed, start checking from the next era
        const nextEra = localMeta?.checked.at(-1) || 0
        const maybeNextEra = localMeta ? nextEra - 1 : activeEra.index

        // Check from the possible next era `maybeNextEra`
        processEligibility(activeAddress, maybeNextEra)
      }
    }
  }, [inSetup(), isReady, activeEra.index, erasToCheckPerBlock, isBonding()])

  // handle worker message on completed exposure check
  worker.onmessage = (message: MessageEvent) => {
    if (message) {
      // ensure correct task received
      const { data } = message
      const { task } = data
      if (task !== 'processEraForExposure') {
        return
      }

      // ensure still same conditions
      const { networkName, who } = data
      if (networkName !== network || who !== getAccount(activeAddress)) {
        return
      }

      const { era, exposed } = data

      // ensure checked eras are in order highest first
      const checked = metaRef.current.checked
        .concat(Number(era))
        .sort((a: number, b: number) => b - a)

      if (!metaRef.current.checked.includes(Number(era))) {
        // update localStorage with updated changes
        localStorage.setItem(
          getLocalkey(who),
          JSON.stringify({
            isExposed: exposed,
            checked,
          })
        )

        // update check metadata
        setStateWithRef(
          {
            checked,
          },
          setMeta,
          metaRef
        )
      }

      if (exposed) {
        // Account is exposed - stop checking
        // cancel checking and update exposed state
        setStateWithRef(false, setChecking, checkingRef)
        setStateWithRef(true, setIsExposed, isExposedRef)
      } else if (bondDuration + 1 === checked.length) {
        // successfully checked current era - bondDuration eras
        setStateWithRef(false, setChecking, checkingRef)
        setStateWithRef(false, setIsExposed, isExposedRef)
      } else {
        // Finished, not exposed
        // continue checking the next era
        checkEra(era - 1)
      }
    }
  }

  // initiate fast unstake eligibility check
  const processEligibility = async (a: MaybeAddress, era: number) => {
    // ensure current era has synced
    if (
      era < 0 ||
      !(bondDuration > 0) ||
      !a ||
      checkingRef.current ||
      !getAccount(activeAddress) ||
      !isBonding()
    ) {
      return
    }

    setStateWithRef(true, setChecking, checkingRef)
    checkEra(era)
  }

  // calls service worker to check exppsures for given era
  const checkEra = async (era: number) => {
    const exposures = await fetchEraStakers(era.toString())

    worker.postMessage({
      task: 'processEraForExposure',
      era: era.toString(),
      who: getAccount(activeAddress),
      networkName: network,
      exitOnExposed: true,
      maxExposurePageSize: maxExposurePageSize.toString(),
      exposures,
    })
  }

  useEffect(() => {
    const subFastUnstakeConfig = fastUnstakeConfig$.subscribe((result) => {
      setHead(result.head)
      setCounterForQueue(result.counterForQueue)
    })
    const subFastUnstakeQueue = fastUnstakeQueue$.subscribe((result) => {
      setQueueDeposit(result)
    })

    return () => {
      subFastUnstakeConfig.unsubscribe()
      subFastUnstakeQueue.unsubscribe()
    }
  }, [])

  // gets any existing fast unstake metadata for an account
  const getLocalMeta = (): LocalMeta | null => {
    const localMeta: AnyJson = localStorage.getItem(getLocalkey(activeAddress))
    if (!localMeta) {
      return null
    }

    const localMetaValidated = validateLocalExposure(
      JSON.parse(localMeta),
      checkToEra
    )
    if (!localMetaValidated) {
      // remove if not valid
      localStorage.removeItem(getLocalkey(activeAddress))
      return null
    }
    // set validated localStorage
    localStorage.setItem(
      getLocalkey(activeAddress),
      JSON.stringify(localMetaValidated)
    )
    return localMetaValidated
  }

  return (
    <FastUnstakeContext.Provider
      value={{
        getLocalkey,
        checking,
        meta,
        isExposed,
        queueDeposit,
        head,
        counterForQueue,
      }}
    >
      {children}
    </FastUnstakeContext.Provider>
  )
}
