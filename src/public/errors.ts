/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

class NotificationError extends Error {
  constructor(msg?: string) {
    super(msg)
    this.name = this.constructor.name
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * The configuration has not been initialized for the Notification Client.
 */
export class NotificationServiceConfigNotFoundError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * A specified notifiable service is not configured as notifiable.
 */
export class InvalidConfigurationError extends NotificationError {
  constructor(serviceName: string) {
    super(serviceName)
  }
}

/**
 * The PushSubscription passed to the SDK when calling registerPushSubscription
 * or updatePushSubscription is not formed as expected. The PushSubscription
 * must have an endpoint and auth and p256dh keys.
 */
export class InvalidPushSubscriptionError extends NotificationError {
  constructor(property: string) {
    super(property)
  }
}

/**
 * The device or push subscription is already registered.
 */
export class DeviceAlreadyRegisteredError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The device or push subscription could not be found
 */
export class DeviceNotFoundError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The device or push subscription could not be registered
 */
export class DeviceCreateError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The device or push subscription could not be read
 */
export class DeviceReadError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The device or push subscription could not be updated
 */
export class DeviceUpdateError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The device or push subscription could not be deleted
 */
export class DeviceDeleteError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * More than one SudoNotificationFilterClient for the given service name is
 * being registered. At most one is permitted per service.
 */
export class DuplicateNotificationFilterClientError extends NotificationError {
  constructor(serviceName: string) {
    super(serviceName)
  }
}

/**
 * More than one SudoNotifiableClient for the given service name is
 * being registered. At most one is permitted per service.
 */
export class DuplicateNotifiableClientError extends NotificationError {
  constructor(serviceName: string) {
    super(serviceName)
  }
}

/**
 * The metadata schema information passed when setting notification configuration
 * setting is not valid.
 */
export class SchemaValidationError extends NotificationError {
  constructor(message?: string) {
    super(message)
  }
}

/**
 * The user notification settings could not be read
 */
export class UserInfoReadError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}

/**
 * The user notification settings could not be updated
 */
export class UserInfoUpdateError extends NotificationError {
  constructor(msg?: string) {
    super(msg)
  }
}
