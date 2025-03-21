/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { SudoUserClient } from '@sudoplatform/sudo-user'
import { SudoNotificationFilterClient } from './sudoNotificationFilterClient'

/**
 * Options passed in to DefaultSudoNotificationClient's constructor
 */
export interface SudoNotificationClientOptions {
  /** Sudo User client to use. No default */
  sudoUserClient: SudoUserClient
  /** Array of notifiable Sudo Platform services */
  notifiableServices: SudoNotificationFilterClient[]
}
