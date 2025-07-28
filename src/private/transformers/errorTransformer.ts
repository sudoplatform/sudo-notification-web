/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  AppSyncError,
  mapGraphQLToClientError,
} from '@sudoplatform/sudo-common'
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
} from '../../public/errors'

export class ErrorTransformer {
  static toClientError(error: AppSyncError): Error {
    switch (error.errorType) {
      case 'sudoplatform.ns.DeviceExist':
        return new DeviceAlreadyRegisteredError(error.message)
      case 'sudoplatform.ns.DeviceNotFound':
        return new DeviceNotFoundError(error.message)
      case 'sudoplatform.ns.DeviceCreate':
        return new DeviceCreateError(error.message)
      case 'sudoplatform.ns.DeviceUpdate':
        return new DeviceUpdateError(error.message)
      case 'sudoplatform.ns.DeviceDelete':
        return new DeviceDeleteError(error.message)
      case 'sudoplatform.ns.DeviceRead':
        return new DeviceReadError(error.message)
      case 'sudoplatform.ns.SchemaValidation':
        return new SchemaValidationError(error.message)
      case 'sudoplatform.ns.UserInfoRead':
        return new UserInfoReadError(error.message)
      case 'sudoplatform.ns.UserInfoUpdate':
        return new UserInfoUpdateError(error.message)
      default:
        return mapGraphQLToClientError(error)
    }
  }
}
