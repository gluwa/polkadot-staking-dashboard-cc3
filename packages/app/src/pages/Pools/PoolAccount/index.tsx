// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Polkicon } from '@w3ux/react-polkicon'
import { ellipsisFn } from '@w3ux/utils'
import { motion } from 'framer-motion'
import { ButtonCopy } from 'library/ButtonCopy'
import { useTranslation } from 'react-i18next'
import type { PoolAccountProps } from '../types'
import { Wrapper } from './Wrapper'

export const PoolAccount = ({ address }: PoolAccountProps) => {
  const { t } = useTranslation('pages')

  return (
    <Wrapper>
      <motion.div
        className="account"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {address === null ? (
          <h4>{t('notSet')}</h4>
        ) : (
          <>
            <div className="icon">
              <Polkicon address={address} />
            </div>
            <h4>{ellipsisFn(address)}</h4>
          </>
        )}
        <div>
          {address !== null && (
            <span className="copy">
              <ButtonCopy value={address} size="1rem" />
            </span>
          )}
        </div>
      </motion.div>
    </Wrapper>
  )
}
