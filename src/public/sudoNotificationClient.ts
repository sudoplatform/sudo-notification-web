/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DefaultConfigurationManager,
  DefaultLogger,
  NotSignedInError,
  OperationNotImplementedError,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import { ClientEnvType, SendTestNotificationInput } from '../gen/graphqlTypes'
import { ApiClient } from '../private/apiClient'
import { SERVICE_NAME } from '../private/constants'
import { BuildTypeTransformer } from '../private/transformers/buildTypeTransformer'
import { NotificationConfigurationTransformer } from '../private/transformers/notificationConfigurationTransformer'
import { NotificationMetadataTransformer } from '../private/transformers/notificationMetadataTransformer'
import { CanonicalPushSubscriptionJSON } from '../private/types/canonicalPushSubscriptionJSON'
import {
  NotifiableServiceConfig,
  NotifiableServiceConfigCodec,
} from '../private/types/notifiableServiceConfig'
import {
  NotificationServiceConfig,
  NotificationServiceConfigCodec,
} from '../private/types/notificationServiceConfig'
import { SudoNotificationClientPrivateOptions } from '../private/types/sudoNotificationClientPrivateOptions'
import {
  DuplicateNotificationFilterClientError,
  InvalidConfigurationError,
  InvalidPushSubscriptionError,
  NotificationServiceConfigNotFoundError,
} from './errors'
import { NotificationConfiguration } from './types/notificationConfiguration'
import { NotificationDeviceInfo } from './types/notificationDeviceInfo'
import { SudoNotificationClientOptions } from './types/sudoNotificationClientOptions'
import { SudoNotificationFilterClient } from './types/sudoNotificationFilterClient'

/**
 * Client used to interface with the Sudo Notification Platform service.
 *
 * It is recommended to code to this interface, rather than the implementation class (`DefaultSudoNotificationClient`) as
 * the implementation class is only meant to be used for initializing an instance of the client.
 */
export interface SudoNotificationClient {
  /**
   * Register to receive Sudo Platform web push notifications on a given
   * Web Push API subscription.
   *
   * @param deviceInfo Information that identifies the user's device and application
   * @param pushSubscription The web push subscription to register
   *
   * @throws NotSignedInError if user is not signed in
   * @throws DeviceAlreadyRegisteredError if the same subscription has already been registered
   * @throws DeviceCreateError if some other issue registering the subscription occurs
   */
  registerPushSubscription(
    deviceInfo: NotificationDeviceInfo,
    pushSubscription: PushSubscription,
  ): Promise<void>

  /**
   * Update registration for the user with new push subscription information.
   *
   * @param deviceInfo Information that identifies the user's device and application
   * @param pushSubscription
   *    Push subscription to update. The push subscription's endpoint must be
   *    the same. The only reason to update is to change the subscription's
   *    expiration.
   *
   *  @throws {@link DeviceNotFoundError} if the push subscription has not been registered
   *  @throws {@link DeviceUpdateError} if the device update fails
   */
  updatePushSubscription(
    deviceInfo: NotificationDeviceInfo,
    pushSubscription: PushSubscription,
  ): Promise<void>

  /**
   * Deregister a push subscription for the user
   *
   * @param deviceInfo Information that identifies the user's device and application
   *
   * @throws {@link DeviceNotFoundError} if the push subscription has not been registered
   * @throws {@link DeviceDeleteError} if the deregistration fails
   */
  deregisterPushSubscription(deviceInfo: NotificationDeviceInfo): Promise<void>

  /**
   * Get the user's current set of notification configurations for a push
   * subscription.
   *
   * @param deviceInfo Information that identifies the user's device and application
   *
   * @throws {@link DeviceNotFoundError} if the device has not been registered
   * @throws {@link DeviceReadError} if the retrieval fails for some other reason
   */
  getNotificationConfiguration(
    deviceInfo: NotificationDeviceInfo,
  ): Promise<NotificationConfiguration>

  /**
   * Set the notification configuration for the user.
   *
   * @param deviceInfo Information that identifies the user's device and application
   *
   * @throws {@link DeviceNotFoundError} if the device has not been registered
   * @throws {@link SchemaValidationError} if the retrieval fails for some other reason
   */
  setNotificationConfiguration(
    deviceInfo: NotificationDeviceInfo,
    config: NotificationConfiguration,
  ): Promise<void>

  /** @ignore */
  sendTestNotification(input: SendTestNotificationInput): Promise<boolean>
}

/**
 * Default {@link SudoNotificationClient} for use by Sudo Platform applications.
 */
export class DefaultSudoNotificationClient implements SudoNotificationClient {
  private readonly apiClient: ApiClient
  private readonly sudoUserClient: SudoUserClient
  private readonly notifiableServices: SudoNotificationFilterClient[] = []
  private readonly notificationServiceConfig: NotificationServiceConfig
  private readonly logger = new DefaultLogger('DefaultSudoNotificationClient')

  /**
   * Constructor
   *
   * @param opts Constructor options
   *    {@link SudoNotificationClientOptions.sudoUserClient} user client to authenticate the user
   *    {@link SudoNotificationClientOptions.notifiableServices} array of {@link SudoNotificationFilterClient}s from
   *    other notification enabled Sudo Platform SDKs.
   *
   * @throws
   *    NotificationServiceConfigNotFoundError if the Sudo Platform Notification Service is
   *    deployed in the Sudo Platform environment in which the SDK is being used.
   *
   * @throws
   *    InvalidConfigurationError if any of the services identified in opts.notifiableServices does
   *    not have notifications enabled.
   */
  public constructor(opts: SudoNotificationClientOptions) {
    const privateOptions = opts as SudoNotificationClientPrivateOptions

    this.sudoUserClient = opts.sudoUserClient

    this.apiClient = privateOptions?.apiClient ?? new ApiClient()

    const configurationManager =
      privateOptions.configurationManager ??
      DefaultConfigurationManager.getInstance()

    try {
      this.notificationServiceConfig =
        configurationManager.bindConfigSet<NotificationServiceConfig>(
          NotificationServiceConfigCodec,
          SERVICE_NAME,
        )
    } catch (err) {
      this.logger.error(
        'unable to read notificationService configuration from sudoplatform.json',
        { err },
      )
      throw new NotificationServiceConfigNotFoundError()
    }

    for (const notifiableService of opts.notifiableServices) {
      const notifiableServiceConfig =
        configurationManager.bindConfigSet<NotifiableServiceConfig>(
          NotifiableServiceConfigCodec,
          notifiableService.serviceName,
        )
      if (!notifiableServiceConfig.notifiable) {
        throw new InvalidConfigurationError(notifiableService.serviceName)
      }

      if (
        this.notifiableServices.some(
          (n) => n.serviceName === notifiableService.serviceName,
        )
      ) {
        throw new DuplicateNotificationFilterClientError(
          notifiableService.serviceName,
        )
      }

      this.notifiableServices.push(notifiableService)
    }
  }

  public async registerPushSubscription(
    deviceInfo: NotificationDeviceInfo,
    pushSubscription: PushSubscription,
  ): Promise<void> {
    await this.checkIsSignedInOrThrow()

    const token = this.canonicalPushSubscriptionJson(pushSubscription.toJSON())
    const tokenString = JSON.stringify(token)

    await this.apiClient.registerAppOnDevice({
      standardToken: tokenString,
      build: BuildTypeTransformer.toGraphQL(deviceInfo.buildType),
      bundleId: deviceInfo.bundleId,
      version: deviceInfo.appVersion,
      locale: deviceInfo.locale,
      clientEnv: ClientEnvType.Web,
      deviceId: deviceInfo.deviceId,
    })
  }

  public async updatePushSubscription(
    deviceInfo: NotificationDeviceInfo,
    pushSubscription: PushSubscription,
  ): Promise<void> {
    await this.checkIsSignedInOrThrow()

    const token = this.canonicalPushSubscriptionJson(pushSubscription.toJSON())
    const tokenString = JSON.stringify(token)

    await this.apiClient.updateDeviceInfo({
      standardToken: tokenString,
      build: BuildTypeTransformer.toGraphQL(deviceInfo.buildType),
      bundleId: deviceInfo.bundleId,
      version: deviceInfo.appVersion,
      locale: deviceInfo.locale,
      deviceId: deviceInfo.deviceId,
    })
  }

  public async deregisterPushSubscription(
    deviceInfo: NotificationDeviceInfo,
  ): Promise<void> {
    await this.checkIsSignedInOrThrow()

    await this.apiClient.deleteAppFromDevice({
      bundleId: deviceInfo.bundleId,
      deviceId: deviceInfo.deviceId,
    })
  }

  public async getNotificationConfiguration(
    deviceInfo: NotificationDeviceInfo,
  ): Promise<NotificationConfiguration> {
    await this.checkIsSignedInOrThrow()

    const settings = await this.apiClient.getNotificationSettings({
      bundleId: deviceInfo.bundleId,
      deviceId: deviceInfo.deviceId,
    })

    return NotificationConfigurationTransformer.toAPI(settings)
  }

  public async setNotificationConfiguration(
    deviceInfo: NotificationDeviceInfo,
    config: NotificationConfiguration,
  ): Promise<void> {
    await this.checkIsSignedInOrThrow()

    const services = this.notifiableServices
      .map((client) => client.getSchema())
      .map((schema) => NotificationMetadataTransformer.toGraphQL(schema))

    await this.apiClient.updateNotificationSettings({
      bundleId: deviceInfo.bundleId,
      deviceId: deviceInfo.deviceId,
      filter: NotificationConfigurationTransformer.toGraphQLFilters(config),
      services,
    })
  }

  /** @ignore */
  public async sendTestNotification(
    input: SendTestNotificationInput,
  ): Promise<boolean> {
    if (!this.notificationServiceConfig.testNotificationsAvailable) {
      throw new OperationNotImplementedError()
    }

    await this.checkIsSignedInOrThrow()

    return await this.apiClient.sendTestNotification(input)
  }

  /**
   * Visible for testing
   *
   * @ignore
   */
  public canonicalPushSubscriptionJson(
    json: PushSubscriptionJSON,
  ): CanonicalPushSubscriptionJSON {
    if (!json.endpoint) {
      throw new InvalidPushSubscriptionError('endpoint')
    }

    const authKey = json.keys?.['auth']
    if (!authKey) {
      throw new InvalidPushSubscriptionError('keys.auth')
    }

    const p256DHKey = json.keys?.['p256dh']
    if (!p256DHKey) {
      throw new InvalidPushSubscriptionError('keys.p256dh')
    }

    const canonical: CanonicalPushSubscriptionJSON = {
      endpoint: json.endpoint,
      keys: {
        auth: authKey,
        p256dh: p256DHKey,
      },
    }
    if (json.expirationTime !== undefined && json.expirationTime !== null) {
      canonical.expirationTime = json.expirationTime
    }

    return canonical
  }

  private async checkIsSignedInOrThrow(): Promise<void> {
    if (!(await this.sudoUserClient.isSignedIn())) {
      throw new NotSignedInError()
    }
  }
}
