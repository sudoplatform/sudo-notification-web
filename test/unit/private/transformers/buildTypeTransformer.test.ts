/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { BuildType as BuildTypeGraphQL } from '../../../../src/gen/graphqlTypes'
import { BuildTypeTransformer } from '../../../../src/private/transformers/buildTypeTransformer'
import { BuildType as BuildTypeAPI } from '../../../../src/public/types/buildType'

describe('BuildTypeTransformer', () => {
  describe('toGraphQL', () => {
    it('should convert API values to equivalent GraphQL', () => {
      // Do this dynamically with a switch rather than an `it.each` for example so any
      // changes to BuildType enum will result in compile errors here.
      for (const value of Object.values(BuildTypeAPI) as BuildTypeAPI[]) {
        let expected: BuildTypeGraphQL
        switch (value) {
          case BuildTypeAPI.DEBUG:
            expected = BuildTypeGraphQL.Debug
            break
          case BuildTypeAPI.RELEASE:
            expected = BuildTypeGraphQL.Release
            break
        }
        expect({
          value,
          result: BuildTypeTransformer.toGraphQL(value),
        }).toEqual({
          value,
          result: expected,
        })
      }
    })

    it('should convert GraphQL values to equivalent API', () => {
      // Do this dynamically with a switch rather than an `it.each` for example so any
      // changes to BuildType enum will result in compile errors here.
      for (const value of Object.values(
        BuildTypeGraphQL,
      ) as BuildTypeGraphQL[]) {
        let expected: BuildTypeAPI
        switch (value) {
          case BuildTypeGraphQL.Debug:
            expected = BuildTypeAPI.DEBUG
            break
          case BuildTypeGraphQL.Release:
            expected = BuildTypeAPI.RELEASE
            break
        }
        expect({ value, result: BuildTypeTransformer.toAPI(value) }).toEqual({
          value,
          result: expected,
        })
      }
    })
  })
})
