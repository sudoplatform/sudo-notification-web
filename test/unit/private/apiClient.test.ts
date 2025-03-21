/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiClientManager } from '@sudoplatform/sudo-api-client'
import {
  AppSyncError,
  FatalError,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import { NetworkStatus } from 'apollo-client/core/networkStatus'
import { ApolloError } from 'apollo-client/errors/ApolloError'
import AWSAppSyncClient from 'aws-appsync'
import { GraphQLFormattedError } from 'graphql'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import {
  BuildType,
  ClientEnvType,
  DeleteAppFromDeviceDocument,
  DeleteAppFromDeviceInput,
  DeleteAppFromDeviceMutation,
  FilterAction,
  GetNotificationSettingsDocument,
  GetNotificationSettingsQuery,
  GetSettingsInput,
  NotificationSettingsOutputFragment,
  RegisterAppOnDeviceDocument,
  RegisterAppOnDeviceInput,
  RegisterAppOnDeviceMutation,
  SendTestNotificationDocument,
  SendTestNotificationInput,
  SendTestNotificationMutation,
  UpdateDeviceInfoDocument,
  UpdateDeviceInfoMutation,
  UpdateInfoInput,
  UpdateNotificationSettingsDocument,
  UpdateNotificationSettingsMutation,
  UpdateSettingsInput,
} from '../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../src/private/apiClient'
import { DeviceAlreadyRegisteredError } from '../../../src/public/errors'

describe('ApiClient', () => {
  const mockApiClientManager = mock<ApiClientManager>()
  const mockClient = mock<AWSAppSyncClient<NormalizedCacheObject>>()

  let iut: ApiClient

  beforeEach(() => {
    reset(mockApiClientManager)
    reset(mockClient)

    when(mockApiClientManager.getClient(anything())).thenReturn(
      instance(mockClient),
    )

    iut = new ApiClient(instance(mockApiClientManager))
  })

  const build = BuildType.Release
  const bundleId = 'com.sudoplatform.jest.bundle-id'
  const deviceId = 'device-id'
  const clientEnv = ClientEnvType.Web
  const standardToken = 'standard-token'
  const serviceName = 'service-name'

  const graphqlError: AppSyncError = {
    locations: undefined,
    path: undefined,
    nodes: undefined,
    source: undefined,
    positions: undefined,
    originalError: undefined,
    extensions: {},
    toJSON: function (): GraphQLFormattedError {
      throw new Error('Function not implemented.')
    },
    name: 'sudoplatform.ns.DeviceExist',
    message: 'sudoplatform.ns.DeviceExist',
    errorType: 'sudoplatform.ns.DeviceExist',
  }
  const apolloError = new ApolloError({ graphQLErrors: [graphqlError] })

  describe('registerAppOnDevice', () => {
    it.each`
      result       | expected
      ${true}      | ${true}
      ${false}     | ${false}
      ${undefined} | ${false}
      ${null}      | ${false}
    `(
      'should successfully map register result $result to $expected',
      async ({ result, expected }) => {
        when(
          mockClient.mutate<RegisterAppOnDeviceMutation>(anything()),
        ).thenResolve({ data: { registerAppOnDevice: result } })

        const input: RegisterAppOnDeviceInput = {
          build,
          bundleId,
          deviceId,
          clientEnv,
          standardToken,
        }
        await expect(iut.registerAppOnDevice(input)).resolves.toEqual(expected)

        verify(mockClient.mutate(anything())).once()
        const [actualInput] = capture(
          mockClient.mutate<RegisterAppOnDeviceMutation>,
        ).first()

        expect(actualInput).toEqual({
          mutation: RegisterAppOnDeviceDocument,
          variables: {
            input,
          },
        })
      },
    )
  })

  describe('updateDeviceInfo', () => {
    it.each`
      result       | expected
      ${true}      | ${true}
      ${false}     | ${false}
      ${undefined} | ${false}
      ${null}      | ${false}
    `(
      'should successfully map update result $result to $expected',
      async ({ result, expected }) => {
        when(
          mockClient.mutate<UpdateDeviceInfoMutation>(anything()),
        ).thenResolve({ data: { updateDeviceInfo: result } })

        const input: UpdateInfoInput = {
          build,
          bundleId,
          deviceId,
          standardToken: `${standardToken}-updated`,
        }
        await expect(iut.updateDeviceInfo(input)).resolves.toEqual(expected)

        verify(mockClient.mutate(anything())).once()
        const [actualInput] = capture(
          mockClient.mutate<UpdateDeviceInfoMutation>,
        ).first()

        expect(actualInput).toEqual({
          mutation: UpdateDeviceInfoDocument,
          variables: {
            input,
          },
        })
      },
    )
  })

  describe('deleteAppFromDevice', () => {
    it.each`
      result       | expected
      ${true}      | ${true}
      ${false}     | ${false}
      ${undefined} | ${false}
      ${null}      | ${false}
    `(
      'should successfully map delete result $result to $expected',
      async ({ result, expected }) => {
        when(
          mockClient.mutate<DeleteAppFromDeviceMutation>(anything()),
        ).thenResolve({ data: { deleteAppFromDevice: result } })

        const input: DeleteAppFromDeviceInput = {
          bundleId,
          deviceId,
        }
        await expect(iut.deleteAppFromDevice(input)).resolves.toEqual(expected)

        verify(mockClient.mutate(anything())).once()
        const [actualInput] = capture(
          mockClient.mutate<DeleteAppFromDeviceMutation>,
        ).first()

        expect(actualInput).toEqual({
          mutation: DeleteAppFromDeviceDocument,
          variables: {
            input,
          },
        })
      },
    )
  })

  describe('getNotificationSettings', () => {
    it('should successfully retrieve notification settings', async () => {
      const output: NotificationSettingsOutputFragment = {
        filter: [
          {
            serviceName,
            actionType: FilterAction.Enable,
            rule: '[{"==":[1,1]}',
          },
        ],
      }

      when(
        mockClient.query<GetNotificationSettingsQuery>(anything()),
      ).thenResolve({
        data: {
          getNotificationSettings: output,
        },
        loading: false,
        networkStatus: NetworkStatus.ready,
        stale: false,
      })

      const input: GetSettingsInput = { bundleId, deviceId }
      await expect(iut.getNotificationSettings(input)).resolves.toEqual(output)

      verify(mockClient.query(anything())).once()
      const [actualInput] = capture(
        mockClient.query<GetNotificationSettingsQuery>,
      ).first()

      expect(actualInput).toEqual({
        query: GetNotificationSettingsDocument,
        variables: {
          input,
        },
        fetchPolicy: 'network-only',
      })
    })
  })

  describe('updateNotificationSettings', () => {
    it.each`
      result       | expected
      ${true}      | ${true}
      ${false}     | ${false}
      ${undefined} | ${false}
      ${null}      | ${false}
    `(
      'should successfully map update notification settings result $result to $expected',
      async ({ result, expected }) => {
        when(
          mockClient.mutate<UpdateNotificationSettingsMutation>(anything()),
        ).thenResolve({ data: { updateNotificationSettings: result } })

        const input: UpdateSettingsInput = {
          bundleId,
          deviceId,
          filter: [
            {
              serviceName,
              actionType: FilterAction.Enable,
              rule: '[{"==":[1,1]}',
            },
          ],
          services: [{ serviceName, schema: [] }],
        }
        await expect(iut.updateNotificationSettings(input)).resolves.toEqual(
          expected,
        )

        verify(mockClient.mutate(anything())).once()
        const [actualInput] = capture(
          mockClient.mutate<UpdateNotificationSettingsMutation>,
        ).first()

        expect(actualInput).toEqual({
          mutation: UpdateNotificationSettingsDocument,
          variables: {
            input,
          },
        })
      },
    )
  })

  describe('sendTestNotification', () => {
    it.each`
      result   | expected
      ${true}  | ${true}
      ${false} | ${false}
    `(
      'should successfully map update notification settings result $result to $expected',
      async ({ result, expected }) => {
        when(
          mockClient.mutate<SendTestNotificationMutation>(anything()),
        ).thenResolve({ data: { sendTestNotification: result } })

        const input: SendTestNotificationInput = {
          serviceName,
          data: 'some data',
          filter: '',
        }
        await expect(iut.sendTestNotification(input)).resolves.toEqual(expected)

        verify(mockClient.mutate(anything())).once()
        const [actualInput] = capture(
          mockClient.mutate<SendTestNotificationMutation>,
        ).first()

        expect(actualInput).toEqual({
          mutation: SendTestNotificationDocument,
          variables: {
            input,
          },
        })
      },
    )
  })

  describe('performQuery', () => {
    const input: GetSettingsInput = { bundleId, deviceId }

    it('should map thrown query error to recognized error', async () => {
      when(
        mockClient.query<GetNotificationSettingsQuery>(anything()),
      ).thenReject(apolloError)

      await expect(
        iut.performQuery<GetNotificationSettingsQuery>({
          query: GetNotificationSettingsDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(DeviceAlreadyRegisteredError)
    })

    it('should map thrown unexpected error to UnknownGraphQLError', async () => {
      const error = new Error('Boom!')
      when(
        mockClient.query<GetNotificationSettingsQuery>(anything()),
      ).thenReject(error)

      await expect(
        iut.performQuery<GetNotificationSettingsQuery>({
          query: GetNotificationSettingsDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(new UnknownGraphQLError(error))
    })

    it('should map returned query error to recognized error', async () => {
      when(
        mockClient.query<GetNotificationSettingsQuery>(anything()),
      ).thenResolve({
        data: null as unknown as GetNotificationSettingsQuery,
        errors: [graphqlError],
        loading: false,
        networkStatus: NetworkStatus.loading,
        stale: false,
      })

      await expect(
        iut.performQuery<GetNotificationSettingsQuery>({
          query: GetNotificationSettingsDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(DeviceAlreadyRegisteredError)
    })

    it('should throw FatalError if query response has no data', async () => {
      when(
        mockClient.query<GetNotificationSettingsQuery>(anything()),
      ).thenResolve({
        data: null as unknown as GetNotificationSettingsQuery,
        loading: false,
        networkStatus: NetworkStatus.loading,
        stale: false,
      })
      await expect(
        iut.performQuery<GetNotificationSettingsQuery>({
          query: GetNotificationSettingsDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(FatalError)
    })
  })

  describe('performMutation', () => {
    const input: RegisterAppOnDeviceInput = {
      build,
      bundleId,
      deviceId,
      clientEnv,
    }

    it('should map thrown mutation error to recognized error', async () => {
      when(
        mockClient.mutate<RegisterAppOnDeviceMutation>(anything()),
      ).thenReject(apolloError)

      await expect(
        iut.performMutation<RegisterAppOnDeviceMutation>({
          mutation: RegisterAppOnDeviceDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(DeviceAlreadyRegisteredError)
    })

    it('should map thrown unexpected error to UnknownGraphQLError', async () => {
      const error = new Error('Boom!')
      when(
        mockClient.mutate<RegisterAppOnDeviceMutation>(anything()),
      ).thenReject(error)

      await expect(
        iut.performMutation<RegisterAppOnDeviceMutation>({
          mutation: RegisterAppOnDeviceDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toEqual(new UnknownGraphQLError(error))
    })

    it('should map returned mutation error to recognized error', async () => {
      when(
        mockClient.mutate<RegisterAppOnDeviceMutation>(anything()),
      ).thenResolve({
        data: null,
        errors: [graphqlError],
      })

      await expect(
        iut.performMutation<RegisterAppOnDeviceMutation>({
          mutation: RegisterAppOnDeviceDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(DeviceAlreadyRegisteredError)
    })

    it('should throw FatalError if mutation response has no data', async () => {
      when(
        mockClient.mutate<RegisterAppOnDeviceMutation>(anything()),
      ).thenResolve({
        data: null,
      })

      await expect(
        iut.performMutation<RegisterAppOnDeviceMutation>({
          mutation: RegisterAppOnDeviceDocument,
          variables: { input },
          calleeName: 'jest',
        }),
      ).rejects.toThrow(FatalError)
    })
  })
})
