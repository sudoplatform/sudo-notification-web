/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { NotificationEnableStatus } from './notificationEnabledStatus'

export class NotificationFilterItem {
  public static readonly DEFAULT_RULE_STRING = '{"==": [1, 1]}'

  private readonly _name: string
  private readonly _status: NotificationEnableStatus
  private readonly _rules: string
  private readonly _meta: string

  public constructor(
    name: string,
    status: boolean | undefined,
    rules: string | undefined,
    meta: string | undefined,
  ) {
    status ??= true

    this._name = name
    this._status = status
      ? NotificationEnableStatus.Enable
      : NotificationEnableStatus.Disable
    this._rules = rules || NotificationFilterItem.DEFAULT_RULE_STRING
    this._meta = meta ?? ''
  }

  public get name(): string {
    return this._name
  }

  public get status(): NotificationEnableStatus {
    return this._status
  }

  public get rules(): string {
    return this._rules
  }

  public get meta(): string {
    return this._meta
  }
}
