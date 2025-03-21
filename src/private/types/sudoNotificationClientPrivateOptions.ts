/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { ConfigurationManager } from '@sudoplatform/sudo-common'
import { SudoNotificationClientOptions } from '../../public/types/sudoNotificationClientOptions'
import { ApiClient } from '../apiClient'

/**
 * Private extension to SudoNotificationClientOptions for describing private options
 * for supporting unit testing.
 */
export interface SudoNotificationClientPrivateOptions
  extends SudoNotificationClientOptions {
  /** Override ApiClient construction */
  apiClient?: ApiClient
  /** Override  ConfigurationManager construction */
  configurationManager?: ConfigurationManager
}
