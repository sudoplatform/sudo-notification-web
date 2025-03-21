/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as t from 'io-ts'

export const NotificationServiceConfigCodec = t.intersection(
  [
    t.type({ apiUrl: t.string }),
    t.partial({
      testNotificationsAvailable: t.boolean, // Defaults to false if not present
    }),
  ],
  'NotificationServiceConfig',
)

export type NotificationServiceConfig = t.TypeOf<
  typeof NotificationServiceConfigCodec
>
