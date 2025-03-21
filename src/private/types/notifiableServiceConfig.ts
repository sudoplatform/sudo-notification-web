/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as t from 'io-ts'

export const NotifiableServiceConfigCodec = t.partial(
  { notifiable: t.boolean },
  'NotifiableServiceConfig',
)

export type NotifiableServiceConfig = t.TypeOf<
  typeof NotifiableServiceConfigCodec
>
