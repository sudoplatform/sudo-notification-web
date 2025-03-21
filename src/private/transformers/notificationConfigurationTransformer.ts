/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { Filter, NotificationSettingsOutput } from '../../gen/graphqlTypes'
import { NotificationConfiguration } from '../../public/types/notificationConfiguration'
import { NotificationFilterItem } from '../../public/types/notificationFilterItem'
import { NotificationEnableStatusTransformer } from './notificationEnableStatusTransformer'

export class NotificationConfigurationTransformer {
  public static toAPI(
    graphql: NotificationSettingsOutput,
  ): NotificationConfiguration {
    return new NotificationConfiguration(
      graphql.filter.map(
        (filterItem) =>
          new NotificationFilterItem(
            filterItem.serviceName,
            NotificationEnableStatusTransformer.toBoolean(
              filterItem.actionType,
            ),
            filterItem.rule,
            filterItem.enableMeta ?? undefined,
          ),
      ),
    )
  }
  public static toGraphQLFilters(api: NotificationConfiguration): Filter[] {
    return api.configs.map((config) => ({
      serviceName: config.name,
      actionType: NotificationEnableStatusTransformer.toGraphQL(config.status),
      rule: config.rules,
      enableMeta: config.meta,
    }))
  }
}
