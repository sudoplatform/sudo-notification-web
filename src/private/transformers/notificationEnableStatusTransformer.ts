/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { FilterAction } from '../../gen/graphqlTypes'
import { NotificationEnableStatus } from '../../public/types/notificationEnabledStatus'

export class NotificationEnableStatusTransformer {
  public static toGraphQL(
    api: NotificationEnableStatus | boolean,
  ): FilterAction {
    switch (api) {
      case NotificationEnableStatus.Enable:
      case true:
        return FilterAction.Enable
      case NotificationEnableStatus.Disable:
      case false:
        return FilterAction.Disable
    }
  }

  public static toBoolean(graphql: FilterAction): boolean {
    switch (graphql) {
      case FilterAction.Enable:
        return true
      case FilterAction.Disable:
        return false
    }
  }
}
