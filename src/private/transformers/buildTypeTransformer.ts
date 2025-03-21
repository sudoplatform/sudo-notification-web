/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import { BuildType as BuildTypeGraphQL } from '../../gen/graphqlTypes'
import { BuildType as BuildTypeAPI } from '../../public/types/buildType'

export class BuildTypeTransformer {
  public static toGraphQL(api: BuildTypeAPI): BuildTypeGraphQL {
    switch (api) {
      case BuildTypeAPI.DEBUG:
        return BuildTypeGraphQL.Debug
      case BuildTypeAPI.RELEASE:
        return BuildTypeGraphQL.Release
    }
  }

  public static toAPI(graphql: BuildTypeGraphQL): BuildTypeAPI {
    switch (graphql) {
      case BuildTypeGraphQL.Debug:
        return BuildTypeAPI.DEBUG
      case BuildTypeGraphQL.Release:
        return BuildTypeAPI.RELEASE
    }
  }
}
