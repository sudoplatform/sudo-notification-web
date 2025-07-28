/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ServiceError } from '@sudoplatform/sudo-common'
import { GraphQLFormattedError } from 'graphql'
import { ErrorTransformer } from '../../../../src/private/transformers/errorTransformer'
import {
  DeviceAlreadyRegisteredError,
  DeviceCreateError,
  DeviceDeleteError,
  DeviceNotFoundError,
  DeviceReadError,
  DeviceUpdateError,
  SchemaValidationError,
  UserInfoReadError,
  UserInfoUpdateError,
} from '../../../../src/public/errors'

const message = 'whoops'

describe('ErrorTransformer', () => {
  it.each`
    code                                  | error
    ${'sudoplatform.ns.DeviceExist'}      | ${new DeviceAlreadyRegisteredError(message)}
    ${'sudoplatform.ns.DeviceNotFound'}   | ${new DeviceNotFoundError(message)}
    ${'sudoplatform.ns.DeviceCreate'}     | ${new DeviceCreateError(message)}
    ${'sudoplatform.ns.DeviceUpdate'}     | ${new DeviceUpdateError(message)}
    ${'sudoplatform.ns.DeviceDelete'}     | ${new DeviceDeleteError(message)}
    ${'sudoplatform.ns.DeviceRead'}       | ${new DeviceReadError(message)}
    ${'sudoplatform.ns.SchemaValidation'} | ${new SchemaValidationError(message)}
    ${'sudoplatform.ns.UserInfoRead'}     | ${new UserInfoReadError(message)}
    ${'sudoplatform.ns.UserInfoUpdate'}   | ${new UserInfoUpdateError(message)}
  `('converts $code to correct exception', ({ code, error }) => {
    expect(
      ErrorTransformer.toClientError({
        errorType: code,
        locations: undefined,
        path: undefined,
        nodes: undefined,
        source: undefined,
        positions: undefined,
        originalError: undefined,
        extensions: {},
        toJSON: function (): GraphQLFormattedError {
          throw new Error('Function not implemented.')
        },
        name: code,
        message,
      }),
    ).toEqual(error)
  })

  it('passed non-notification service error to generic mapper', () => {
    const code = 'sudoplatform.ServiceError'
    expect(
      ErrorTransformer.toClientError({
        errorType: code,
        locations: undefined,
        path: undefined,
        nodes: undefined,
        source: undefined,
        positions: undefined,
        originalError: undefined,
        extensions: {},
        toJSON: function (): GraphQLFormattedError {
          throw new Error('Function not implemented.')
        },
        name: code,
        message,
      }),
    ).toEqual(new ServiceError(message))
  })
})
