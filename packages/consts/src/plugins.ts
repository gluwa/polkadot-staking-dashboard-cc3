// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { Plugin } from 'types'

// Force plugins to be enabled in production environment
//
// NOTE: If you are forking the staking dashboard and do not wish to enforce a plugin in production,
// you can remove it from this list
export const CompulsoryPluginsProduction: Plugin[] = ['subscan']

export const PluginsList: Plugin[] = ['subscan', 'polkawatch']
