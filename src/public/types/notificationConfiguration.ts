/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { NotificationFilterItem } from './notificationFilterItem'

export class NotificationConfiguration {
  private _configs: NotificationFilterItem[]

  public constructor(configs: NotificationFilterItem[]) {
    this._configs = configs
  }

  public get configs(): ReadonlyArray<NotificationFilterItem> {
    return this._configs
  }
}
