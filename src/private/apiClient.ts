/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ApiClientManager,
  DefaultApiClientManager,
} from '@sudoplatform/sudo-api-client'
import {
  AppSyncError,
  DefaultLogger,
  FatalError,
  Logger,
  UnknownGraphQLError,
} from '@sudoplatform/sudo-common'
import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import {
  MutationOptions,
  QueryOptions,
} from 'apollo-client/core/watchQueryOptions'
import { ApolloError } from 'apollo-client/errors/ApolloError'
import AWSAppSyncClient from 'aws-appsync'
import {
  DeleteAppFromDeviceDocument,
  DeleteAppFromDeviceInput,
  DeleteAppFromDeviceMutation,
  GetNotificationSettingsDocument,
  GetNotificationSettingsQuery,
  GetSettingsInput,
  GetUserAndDeviceNotificationSettingsDocument,
  GetUserAndDeviceNotificationSettingsQuery,
  GetUserAndDeviceSettingsInput,
  NotificationSettingsOutput,
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
  UserAndDeviceNotificationSettingsOutput,
} from '../gen/graphqlTypes'
import { SERVICE_NAME } from './constants'
import { ErrorTransformer } from './transformers/errorTransformer'

export class ApiClient {
  private readonly log: Logger
  private readonly client: AWSAppSyncClient<NormalizedCacheObject>

  public constructor(apiClientManager?: ApiClientManager) {
    this.log = new DefaultLogger(this.constructor.name)

    const clientManager =
      apiClientManager ?? DefaultApiClientManager.getInstance()

    this.client = clientManager.getClient({
      disableOffline: true,
      configNamespace: SERVICE_NAME,
    })
  }

  public async registerAppOnDevice(
    input: RegisterAppOnDeviceInput,
  ): Promise<boolean> {
    const data = await this.performMutation<RegisterAppOnDeviceMutation>({
      mutation: RegisterAppOnDeviceDocument,
      variables: { input },
      calleeName: this.registerAppOnDevice.name,
    })

    return data.registerAppOnDevice ?? false
  }

  public async deleteAppFromDevice(
    input: DeleteAppFromDeviceInput,
  ): Promise<boolean> {
    const data = await this.performMutation<DeleteAppFromDeviceMutation>({
      mutation: DeleteAppFromDeviceDocument,
      variables: { input },
      calleeName: this.deleteAppFromDevice.name,
    })

    return data.deleteAppFromDevice ?? false
  }

  public async updateDeviceInfo(input: UpdateInfoInput): Promise<boolean> {
    const data = await this.performMutation<UpdateDeviceInfoMutation>({
      mutation: UpdateDeviceInfoDocument,
      variables: { input },
      calleeName: this.updateDeviceInfo.name,
    })

    return data.updateDeviceInfo ?? false
  }

  public async getNotificationSettings(
    input: GetSettingsInput,
  ): Promise<NotificationSettingsOutput> {
    const data = await this.performQuery<GetNotificationSettingsQuery>({
      query: GetNotificationSettingsDocument,
      variables: { input },
      fetchPolicy: 'network-only',
      calleeName: this.getNotificationSettings.name,
    })

    return data.getNotificationSettings
  }

  public async getUserAndDeviceNotificationSettings(
    input: GetUserAndDeviceSettingsInput,
  ): Promise<UserAndDeviceNotificationSettingsOutput> {
    const data =
      await this.performQuery<GetUserAndDeviceNotificationSettingsQuery>({
        query: GetUserAndDeviceNotificationSettingsDocument,
        variables: { input },
        fetchPolicy: 'network-only',
        calleeName: this.getUserAndDeviceNotificationSettings.name,
      })

    return data.getUserAndDeviceNotificationSettings
  }

  public async updateNotificationSettings(
    input: UpdateSettingsInput,
  ): Promise<boolean> {
    const data = await this.performMutation<UpdateNotificationSettingsMutation>(
      {
        mutation: UpdateNotificationSettingsDocument,
        variables: { input },
        calleeName: this.updateNotificationSettings.name,
      },
    )

    return data.updateNotificationSettings ?? false
  }

  public async sendTestNotification(
    input: SendTestNotificationInput,
  ): Promise<boolean> {
    const data = await this.performMutation<SendTestNotificationMutation>({
      mutation: SendTestNotificationDocument,
      variables: { input },
      calleeName: this.sendTestNotification.name,
    })

    return data.sendTestNotification
  }

  async performQuery<Q>({
    variables,
    fetchPolicy,
    query,
    calleeName,
  }: QueryOptions & { calleeName?: string }): Promise<Q> {
    let result
    try {
      result = await this.client.query<Q>({
        variables,
        fetchPolicy,
        query,
      })
    } catch (err) {
      const clientError = err as ApolloError
      this.log.debug('error received', { calleeName, clientError })
      const error = clientError.graphQLErrors?.[0]
      if (error) {
        this.log.debug('appSync query failed with error', { error })
        throw ErrorTransformer.toClientError(error)
      } else {
        throw new UnknownGraphQLError(err)
      }
    }
    const error = result.errors?.[0]
    if (error) {
      this.log.debug('error received', { error })
      throw ErrorTransformer.toClientError(error)
    }
    if (result.data) {
      return result.data
    } else {
      throw new FatalError(
        `${calleeName ?? '<no callee>'} did not return any result`,
      )
    }
  }

  async performMutation<M>({
    mutation,
    variables,
    calleeName,
  }: Omit<MutationOptions<M>, 'fetchPolicy'> & {
    calleeName?: string
  }): Promise<M> {
    let result
    try {
      result = await this.client.mutate<M>({
        mutation,
        variables,
      })
    } catch (err) {
      const clientError = err as ApolloError
      this.log.debug('error received', { calleeName, clientError })
      const error = clientError.graphQLErrors?.[0]
      if (error) {
        this.log.debug('appSync mutation failed with error', { error })
        throw ErrorTransformer.toClientError(error)
      } else {
        throw new UnknownGraphQLError(err as AppSyncError)
      }
    }
    const error = result.errors?.[0]
    if (error) {
      this.log.debug('appSync mutation failed with error', { error })
      throw ErrorTransformer.toClientError(error)
    }
    if (result.data) {
      return result.data
    } else {
      throw new FatalError(
        `${calleeName ?? '<no callee>'} did not return any result`,
      )
    }
  }
}
