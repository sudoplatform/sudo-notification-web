/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotificationConfiguration } from './notificationConfiguration'

/**
 * Result of call to getUserAndDeviceNotificationConfiguration
 */
export interface UserAndDeviceNotificationConfiguration {
  /**
   * User level notification configuration or undefined if no
   * user level notification configuration has been set.
   */
  user?: NotificationConfiguration

  /**
   * Device level notification configuration or undefined if no
   * device level notification configuration has been set, or
   * no device information was provided when calling
   * getUserAndDeviceNotificationConfiguration.
   */
  device?: NotificationConfiguration
}
