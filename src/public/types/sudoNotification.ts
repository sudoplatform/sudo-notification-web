/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Base SudoNotification class. Service specific SDKs provide concrete classes extending this
 * base class that will be returned by SudoNotifiableClient.decodeData.
 */
export abstract class SudoNotification {
  public constructor(
    /**
     *  Name of service for the implementing Sudo Platform SDK. Matches the corresponding
     *  service's configuration section within sudoplatformconfig.json
     */
    public readonly serviceName: string,

    /**
     *  Service specific type of notification.
     */
    public readonly type: string,
  ) {}
}
