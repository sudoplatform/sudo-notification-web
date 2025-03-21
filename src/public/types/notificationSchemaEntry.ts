/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Schema of a single filterable property of a notification
 */
export class NotificationSchemaEntry {
  public constructor(
    /** Description of the filterable property */
    public readonly description: string,
    /** Name of the filterable property */
    public readonly fieldName: string,
    /** Type of the filterable property */
    public readonly type: string,
  ) {}
}
