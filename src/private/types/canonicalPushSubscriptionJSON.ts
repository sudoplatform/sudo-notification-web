/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Canonical form of PushSubscriptionJSON.
 *
 * Adds the following constraints:
 * * endpoint must be defined
 * * expiration cannot be null
 * * auth key must be provided
 * * p256dh key must be provided
 */
export interface CanonicalPushSubscriptionJSON {
  endpoint: string
  expirationTime?: number
  keys: {
    auth: string
    p256dh: string
  }
}
