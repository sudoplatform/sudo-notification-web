/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import * as t from 'io-ts'

/**
 * Decode Sudo Platform notification payload
 */
export const SudoPlatformPayloadCodec = t.type({
  sudoplatform: t.intersection([
    t.type({ servicename: t.string }),
    t.partial({ data: t.string }),
    t.record(t.string, t.unknown),
  ]),
})

export type SudoPlatformPayload = t.TypeOf<typeof SudoPlatformPayloadCodec>
