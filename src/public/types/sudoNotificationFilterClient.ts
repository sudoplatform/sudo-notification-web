/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotificationMetadata } from './notificationMetadata'

/**
 * Client used to provide filter schema information to the notification SDk. Each Sudo Platform service SDK that has
 * notifications provides an implementation of this protocol that must be passed to `DefaultSudoNotificationClient`
 * on construction.
 */
export interface SudoNotificationFilterClient {
  /**
   * Name of service for the implementing Sudo Platform SDK. Matches the corresponding service's configuration
   * section within sudoplatformconfig.json
   */
  serviceName: string

  /**
   * Return the schema describing properties available for filtering for the specific service
   */
  getSchema(): NotificationMetadata
}
