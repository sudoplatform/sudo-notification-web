/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { BuildType } from './buildType'

/**
 * Information that uniquely identifies the device and application that is
 * registering to receive web push notifications. Device IDs a scoped
 * by the user's subject ID and applications' bundle ID and so only needs
 * to be unique among all the user's devices. If bundle ID is shared across
 * platforms then the device ID should be further qualified by platform by
 * the consuming application.
 *
 * Notifications are sent to a subscription associated with a particular
 * device ID, and the device ID is used to contain the notification filter
 * configuration i.e. the rules for which notifications the user wants
 * to receive on the particular device. Consuming applications may need to
 * derive the device ID in a consistent way from the browser environment
 * or persist a generated random device ID.
 */
export interface NotificationDeviceInfo {
  /**
   * ID representing user and device that perists beyond
   * lifetime of a single push subscription
   */
  deviceId: string

  /**
   * Reverse DNS name idenfifying the application. For example
   * com.sudoplatform.examples.notification.
   */
  bundleId: string

  /**
   * Type of build. Allows for separate keys to be used in debug vs production
   * environments.
   */
  buildType: BuildType

  /**
   * Version of the application.
   */
  appVersion: string

  /**
   * User's locale.
   */
  locale: string
}
