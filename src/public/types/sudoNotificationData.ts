/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

export class SudoNotificationData {
  /**
   *
   * @param serviceName
   *  Name of service for the implementing Sudo Platform SDK. Matches the corresponding
   *  service's configuration section within sudoplatformconfig.json
   *
   * @param data
   *  Opaque, serialized service specific notification data
   */
  public constructor(
    public readonly serviceName: string,
    public readonly data?: string,
  ) {}
}
