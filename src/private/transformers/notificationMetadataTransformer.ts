/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { NotifiableServiceSchema } from '../../gen/graphqlTypes'
import { NotificationMetadata } from '../../public/types/notificationMetadata'

export class NotificationMetadataTransformer {
  public static toGraphQL(api: NotificationMetadata): NotifiableServiceSchema {
    return {
      serviceName: api.serviceName,
      schema: api.schema.map((entry) => ({
        description: entry.description,
        fieldName: entry.fieldName,
        type: entry.type,
      })),
    }
  }
}
