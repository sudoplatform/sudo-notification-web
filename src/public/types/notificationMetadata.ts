/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { NotificationSchemaEntry } from './notificationSchemaEntry'

/**
 * Definition of all filterable notification properties of a specific
 * service.
 */
export class NotificationMetadata {
  public constructor(
    /**
     * Name of service for the implementing Sudo Platform SDK. Matches the corresponding service's configuration
     * section within sudoplatformconfig.json
     */
    public readonly serviceName: string,
    /** Array of schema entries, one for each filterable property */
    public readonly schema: ReadonlyArray<NotificationSchemaEntry>,
  ) {}
}
