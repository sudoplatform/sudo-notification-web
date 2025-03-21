/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Build type fo the host application. Allows use of separate VAPID
 * keys between debug and release deployments of the same application.
 */
export enum BuildType {
  RELEASE = 'RELEASE',
  DEBUG = 'DEBUG',
}
