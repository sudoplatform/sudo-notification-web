/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ConfigurationManager,
  ConfigurationSetNotFoundError,
  NotSignedInError,
  OperationNotImplementedError,
} from '@sudoplatform/sudo-common'
import { SudoUserClient } from '@sudoplatform/sudo-user'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  spy,
  verify,
  when,
} from 'ts-mockito'
import {
  ClientEnvType,
  FilterAction,
  FilterOutputEntry,
  NotificationSettingsOutput,
  SendTestNotificationInput,
  UserAndDeviceNotificationSettingsOutput,
} from '../../../src/gen/graphqlTypes'
import { ApiClient } from '../../../src/private/apiClient'
import { SERVICE_NAME } from '../../../src/private/constants'
import { BuildTypeTransformer } from '../../../src/private/transformers/buildTypeTransformer'
import { CanonicalPushSubscriptionJSON } from '../../../src/private/types/canonicalPushSubscriptionJSON'
import { NotifiableServiceConfig } from '../../../src/private/types/notifiableServiceConfig'
import { NotificationServiceConfig } from '../../../src/private/types/notificationServiceConfig'
import { SudoNotificationClientPrivateOptions } from '../../../src/private/types/sudoNotificationClientPrivateOptions'
import {
  DuplicateNotificationFilterClientError,
  InvalidConfigurationError,
  InvalidPushSubscriptionError,
  NotificationServiceConfigNotFoundError,
} from '../../../src/public/errors'
import { DefaultSudoNotificationClient } from '../../../src/public/sudoNotificationClient'
import { BuildType } from '../../../src/public/types/buildType'
import { NotificationConfiguration } from '../../../src/public/types/notificationConfiguration'
import { NotificationDeviceInfo } from '../../../src/public/types/notificationDeviceInfo'
import { NotificationFilterItem } from '../../../src/public/types/notificationFilterItem'
import { NotificationMetadata } from '../../../src/public/types/notificationMetadata'
import { NotificationSchemaEntry } from '../../../src/public/types/notificationSchemaEntry'
import { SudoNotificationFilterClient } from '../../../src/public/types/sudoNotificationFilterClient'

describe('DefaultSudoNotificationClient', () => {
  const mockSudoUserClient = mock<SudoUserClient>()
  const mockApiClient = mock<ApiClient>()
  const mockSudoNotificationFilterClient1 = mock<SudoNotificationFilterClient>()
  const mockSudoNotificationFilterClient2 = mock<SudoNotificationFilterClient>()
  const mockConfigurationManager = mock<ConfigurationManager>()
  const mockPushSubscription = mock<PushSubscription>()

  let spied: DefaultSudoNotificationClient
  let iut: DefaultSudoNotificationClient

  let options: SudoNotificationClientPrivateOptions

  const config: NotificationServiceConfig = {
    apiUrl: 'api-url',
    testNotificationsAvailable: true,
  }

  const bundleId = 'bundle-id'

  const deviceInfo: NotificationDeviceInfo = {
    deviceId: 'device-id',
    buildType: BuildType.RELEASE,
    bundleId,
    appVersion: '1',
    locale: 'en',
  }

  const canonicalPushSubscriptionJson: CanonicalPushSubscriptionJSON = {
    endpoint: 'endpoint-url',
    keys: {
      auth: 'auth-key',
      p256dh: 'p256dh-key',
    },
  }

  beforeEach(() => {
    reset(mockSudoUserClient)
    reset(mockApiClient)
    reset(mockSudoNotificationFilterClient1)
    reset(mockSudoNotificationFilterClient2)
    reset(mockConfigurationManager)
    reset(mockPushSubscription)

    when(
      mockConfigurationManager.bindConfigSet(anything(), SERVICE_NAME),
    ).thenReturn(config)

    when(mockSudoNotificationFilterClient1.serviceName).thenReturn('service-1')
    when(mockSudoNotificationFilterClient2.serviceName).thenReturn('service-2')
    when(
      mockConfigurationManager.bindConfigSet(anything(), 'service-1'),
    ).thenReturn({ notifiable: true })
    when(
      mockConfigurationManager.bindConfigSet(anything(), 'service-2'),
    ).thenReturn({ notifiable: true })

    when(mockSudoUserClient.isSignedIn()).thenResolve(true)

    options = {
      sudoUserClient: instance(mockSudoUserClient),
      notifiableServices: [
        instance(mockSudoNotificationFilterClient1),
        instance(mockSudoNotificationFilterClient2),
      ],
      apiClient: instance(mockApiClient),
      configurationManager: instance(mockConfigurationManager),
    }

    spied = spy(new DefaultSudoNotificationClient(options))
    iut = instance(spied)

    when(spied.canonicalPushSubscriptionJson(anything())).thenReturn(
      canonicalPushSubscriptionJson,
    )
  })

  describe('constructor', () => {
    it('throws NotificationServiceConfigNotFoundError if notification service configuration cannot be bound', () => {
      when(
        mockConfigurationManager.bindConfigSet(anything(), anything()),
      ).thenThrow(new ConfigurationSetNotFoundError())

      expect(() => new DefaultSudoNotificationClient(options)).toThrow(
        NotificationServiceConfigNotFoundError,
      )

      verify(
        mockConfigurationManager.bindConfigSet(anything(), anything()),
      ).atLeast(1)

      const [, actualServiceName] = capture(
        mockConfigurationManager.bindConfigSet<NotifiableServiceConfig>,
      ).last()
      expect(actualServiceName).toEqual(SERVICE_NAME)

      expect(iut).toBeDefined()
    })

    it('throws InvalidConfigurationError if a provided notification filter clients is not notifiable', () => {
      when(
        mockConfigurationManager.bindConfigSet(anything(), 'service-1'),
      ).thenReturn({})

      let thrown: unknown
      try {
        new DefaultSudoNotificationClient(options)
      } catch (err) {
        thrown = err
      }
      expect(thrown).toEqual(new InvalidConfigurationError('service-1'))
    })

    it('throws DuplicateNotificationFilterClientError if two notification filter clients for the same service are provided', () => {
      let thrown: unknown
      try {
        new DefaultSudoNotificationClient({
          ...options,
          notifiableServices: [
            ...options.notifiableServices,
            instance(mockSudoNotificationFilterClient1),
          ],
        })
      } catch (err) {
        thrown = err
      }
      expect(thrown).toEqual(
        new DuplicateNotificationFilterClientError('service-1'),
      )
    })
  })

  describe('registerPushSubscription', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.registerPushSubscription(
          deviceInfo,
          instance(mockPushSubscription),
        ),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.registerAppOnDevice(anything())).never()
    })

    it('should invoke ApiClient registerDeviceOnApp correctly', async () => {
      when(mockApiClient.registerAppOnDevice(anything())).thenResolve(true)

      await expect(
        iut.registerPushSubscription(
          deviceInfo,
          instance(mockPushSubscription),
        ),
      ).resolves.toBeUndefined()

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.registerAppOnDevice(anything())).once()
      const [actualInput] = capture(mockApiClient.registerAppOnDevice).first()
      expect(actualInput).toEqual({
        standardToken: JSON.stringify(canonicalPushSubscriptionJson),
        bundleId: deviceInfo.bundleId,
        deviceId: deviceInfo.deviceId,
        build: BuildTypeTransformer.toGraphQL(deviceInfo.buildType),
        clientEnv: ClientEnvType.Web,
        locale: deviceInfo.locale,
        version: deviceInfo.appVersion,
      })
    })
  })

  describe('updatePushSubscription', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.updatePushSubscription(deviceInfo, instance(mockPushSubscription)),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateDeviceInfo(anything())).never()
    })

    it('should invoke ApiClient updateDeviceInfo correctly', async () => {
      when(mockApiClient.updateDeviceInfo(anything())).thenResolve(true)

      await expect(
        iut.updatePushSubscription(deviceInfo, instance(mockPushSubscription)),
      ).resolves.toBeUndefined()

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateDeviceInfo(anything())).once()
      const [actualInput] = capture(mockApiClient.updateDeviceInfo).first()
      expect(actualInput).toEqual({
        standardToken: JSON.stringify(canonicalPushSubscriptionJson),
        bundleId: deviceInfo.bundleId,
        deviceId: deviceInfo.deviceId,
        build: BuildTypeTransformer.toGraphQL(deviceInfo.buildType),
        locale: deviceInfo.locale,
        version: deviceInfo.appVersion,
      })
    })
  })

  describe('deregisterPushSubscription', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(iut.deregisterPushSubscription(deviceInfo)).rejects.toThrow(
        NotSignedInError,
      )

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.deleteAppFromDevice(anything())).never()
    })

    it('should invoke ApiClient deleteAppFromDevice correctly', async () => {
      when(mockApiClient.deleteAppFromDevice(anything())).thenResolve(true)

      await expect(
        iut.deregisterPushSubscription(deviceInfo),
      ).resolves.toBeUndefined()

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.deleteAppFromDevice(anything())).once()
      const [actualInput] = capture(mockApiClient.deleteAppFromDevice).first()
      expect(actualInput).toEqual({
        bundleId: deviceInfo.bundleId,
        deviceId: deviceInfo.deviceId,
      })
    })
  })

  describe('getNotificationConfiguration', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.getNotificationConfiguration(deviceInfo),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.getNotificationSettings(anything())).never()
    })

    it('should invoke ApiClient getNotificationSettings correctly', async () => {
      const item: FilterOutputEntry = {
        rule: '{"==":[1,1]}',
        serviceName: 'service-1',
        actionType: FilterAction.Enable,
        enableMeta: 'some filter',
      }

      const output: NotificationSettingsOutput = {
        filter: [item],
      }

      when(mockApiClient.getNotificationSettings(anything())).thenResolve(
        output,
      )

      await expect(
        iut.getNotificationConfiguration(deviceInfo),
      ).resolves.toEqual(
        new NotificationConfiguration([
          new NotificationFilterItem(
            item.serviceName,
            true,
            item.rule,
            item.enableMeta ?? undefined,
          ),
        ]),
      )

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.getNotificationSettings(anything())).once()
      const [actualInput] = capture(
        mockApiClient.getNotificationSettings,
      ).first()
      expect(actualInput).toEqual({
        bundleId: deviceInfo.bundleId,
        deviceId: deviceInfo.deviceId,
      })
    })
  })

  describe('getUserNotificationConfiguration', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.getUserNotificationConfiguration(bundleId),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).never()
    })

    it('should invoke ApiClient getUserAndDeviceNotificationSettings correctly', async () => {
      const item: FilterOutputEntry = {
        rule: '{"==":[1,1]}',
        serviceName: 'service-1',
        actionType: FilterAction.Enable,
        enableMeta: 'some filter',
      }

      const output: UserAndDeviceNotificationSettingsOutput = {
        user: {
          filter: [item],
        },
      }

      when(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).thenResolve(output)

      await expect(
        iut.getUserNotificationConfiguration(bundleId),
      ).resolves.toEqual(
        new NotificationConfiguration([
          new NotificationFilterItem(
            item.serviceName,
            true,
            item.rule,
            item.enableMeta ?? undefined,
          ),
        ]),
      )

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).once()
      const [actualInput] = capture(
        mockApiClient.getUserAndDeviceNotificationSettings,
      ).first()
      expect(actualInput).toEqual({
        bundleId,
      })
    })
  })

  describe('getUserAndDeviceNotificationConfiguration', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.getUserAndDeviceNotificationConfiguration(deviceInfo),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).never()
    })

    it('should invoke ApiClient getUserAndDeviceNotificationSettings correctly', async () => {
      const userItem: FilterOutputEntry = {
        rule: '{"==":[1,1]}',
        serviceName: 'service-1',
        actionType: FilterAction.Enable,
        enableMeta: 'some filter',
      }
      const deviceItem: FilterOutputEntry = {
        rule: '{"==":[1,1]}',
        serviceName: 'service-2',
        actionType: FilterAction.Disable,
        enableMeta: 'some filter',
      }

      const output: UserAndDeviceNotificationSettingsOutput = {
        user: {
          filter: [userItem],
        },
        device: {
          filter: [deviceItem],
        },
      }

      when(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).thenResolve(output)

      await expect(
        iut.getUserAndDeviceNotificationConfiguration(deviceInfo),
      ).resolves.toEqual({
        user: new NotificationConfiguration([
          new NotificationFilterItem(
            userItem.serviceName,
            true,
            userItem.rule,
            userItem.enableMeta ?? undefined,
          ),
        ]),
        device: new NotificationConfiguration([
          new NotificationFilterItem(
            deviceItem.serviceName,
            false,
            deviceItem.rule,
            deviceItem.enableMeta ?? undefined,
          ),
        ]),
      })

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(
        mockApiClient.getUserAndDeviceNotificationSettings(anything()),
      ).once()
      const [actualInput] = capture(
        mockApiClient.getUserAndDeviceNotificationSettings,
      ).first()
      expect(actualInput).toEqual({
        bundleId,
        deviceId: deviceInfo.deviceId,
      })
    })
  })

  describe('setNotificationConfiguration', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.setNotificationConfiguration(
          deviceInfo,
          new NotificationConfiguration([
            new NotificationFilterItem(
              'service-1',
              true,
              '{"==":[1,1]}',
              'meta',
            ),
          ]),
        ),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateNotificationSettings(anything())).never()
    })

    it('should invoke ApiClient updateNotificationSettings correctly', async () => {
      const item = new NotificationFilterItem(
        'service-1',
        true,
        '{"==":[1,1]}',
        'some meta',
      )

      const config = new NotificationConfiguration([item])

      when(mockApiClient.updateNotificationSettings(anything())).thenResolve(
        true,
      )

      const entry = new NotificationSchemaEntry(
        'entry description',
        'property',
        'string',
      )
      const schema = new NotificationMetadata('service-1', [entry])

      when(mockSudoNotificationFilterClient1.getSchema()).thenReturn(schema)
      when(mockSudoNotificationFilterClient2.getSchema()).thenReturn(
        new NotificationMetadata('service-2', []),
      )

      await expect(
        iut.setNotificationConfiguration(deviceInfo, config),
      ).resolves.toBeUndefined()

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateNotificationSettings(anything())).once()
      const [actualInput] = capture(
        mockApiClient.updateNotificationSettings,
      ).first()
      expect(actualInput).toEqual<typeof actualInput>({
        bundleId: deviceInfo.bundleId,
        deviceId: deviceInfo.deviceId,
        filter: [
          {
            actionType: FilterAction.Enable,
            enableMeta: item.meta,
            rule: item.rules,
            serviceName: item.name,
          },
        ],
        services: [
          {
            serviceName: schema.serviceName,
            schema: [
              {
                description: entry.description,
                fieldName: entry.fieldName,
                type: entry.type,
              },
            ],
          },
          { serviceName: 'service-2', schema: [] },
        ],
      })
    })
  })

  describe('setUserNotificationConfiguration', () => {
    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.setUserNotificationConfiguration(
          bundleId,
          new NotificationConfiguration([
            new NotificationFilterItem(
              'service-1',
              true,
              '{"==":[1,1]}',
              'meta',
            ),
          ]),
        ),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateNotificationSettings(anything())).never()
    })

    it('should invoke ApiClient updateNotificationSettings correctly', async () => {
      const item = new NotificationFilterItem(
        'service-1',
        true,
        '{"==":[1,1]}',
        'some meta',
      )

      const config = new NotificationConfiguration([item])

      when(mockApiClient.updateNotificationSettings(anything())).thenResolve(
        true,
      )

      const entry = new NotificationSchemaEntry(
        'entry description',
        'property',
        'string',
      )
      const schema = new NotificationMetadata('service-1', [entry])

      when(mockSudoNotificationFilterClient1.getSchema()).thenReturn(schema)
      when(mockSudoNotificationFilterClient2.getSchema()).thenReturn(
        new NotificationMetadata('service-2', []),
      )

      await expect(
        iut.setUserNotificationConfiguration(bundleId, config),
      ).resolves.toBeUndefined()

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.updateNotificationSettings(anything())).once()
      const [actualInput] = capture(
        mockApiClient.updateNotificationSettings,
      ).first()
      expect(actualInput).toEqual<typeof actualInput>({
        bundleId: deviceInfo.bundleId,
        filter: [
          {
            actionType: FilterAction.Enable,
            enableMeta: item.meta,
            rule: item.rules,
            serviceName: item.name,
          },
        ],
        services: [
          {
            serviceName: schema.serviceName,
            schema: [
              {
                description: entry.description,
                fieldName: entry.fieldName,
                type: entry.type,
              },
            ],
          },
          { serviceName: 'service-2', schema: [] },
        ],
      })
    })
  })

  describe('sendTestNotification', () => {
    it('throws OperationNotImplementedError if testNotificationsAvailable in config is false', async () => {
      when(
        mockConfigurationManager.bindConfigSet(anything(), SERVICE_NAME),
      ).thenReturn({
        apiUrl: 'api-url',
        testNotificationsAvailable: false,
      })

      const localIUT = new DefaultSudoNotificationClient(options)

      await expect(
        localIUT.sendTestNotification({
          data: 'some-data',
          filter: 'some-filter',
          serviceName: 'service-1',
        }),
      ).rejects.toThrow(OperationNotImplementedError)

      verify(mockSudoUserClient.isSignedIn()).never()
      verify(mockApiClient.sendTestNotification(anything())).never()
    })

    it('should throw NotSignedInError if user is not signed in', async () => {
      when(mockSudoUserClient.isSignedIn()).thenResolve(false)

      await expect(
        iut.sendTestNotification({
          data: 'some-data',
          filter: 'some-filter',
          serviceName: 'service-1',
        }),
      ).rejects.toThrow(NotSignedInError)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.sendTestNotification(anything())).never()
    })

    it('should invoke ApiClient sendTestNotification correctly', async () => {
      when(mockApiClient.sendTestNotification(anything())).thenResolve(true)

      const input: SendTestNotificationInput = {
        body: 'body',
        data: 'data',
        filter: 'filter',
        serviceName: 'service-1',
      }

      await expect(iut.sendTestNotification(input)).resolves.toEqual(true)

      verify(mockSudoUserClient.isSignedIn()).once()
      verify(mockApiClient.sendTestNotification(anything())).once()
      const [actualInput] = capture(mockApiClient.sendTestNotification).first()
      expect(actualInput).toEqual<typeof actualInput>(input)
    })
  })

  describe('canonicalPushSubscriptionJson', () => {
    beforeEach(() => {
      // Make sure that no when's are operating on canonicalPushSubscriptionJson
      reset(spied)
    })

    it('should throw InvalidPushSubscriptionError if subscription has no endpoint', () => {
      let caught: unknown
      try {
        iut.canonicalPushSubscriptionJson({
          keys: { auth: 'auth-key', p256dh: 'p256dh-key' },
        })
      } catch (err) {
        caught = err
      }
      expect(caught).toEqual(new InvalidPushSubscriptionError('endpoint'))
    })

    it('should throw InvalidPushSubscriptionError if subscription has no keys', () => {
      let caught: unknown
      try {
        iut.canonicalPushSubscriptionJson({
          endpoint: 'endpoint',
        })
      } catch (err) {
        caught = err
      }
      expect(caught).toEqual(new InvalidPushSubscriptionError('keys.auth'))
    })

    it('should throw InvalidPushSubscriptionError if subscription has no auth key', () => {
      let caught: unknown
      try {
        iut.canonicalPushSubscriptionJson({
          endpoint: 'endpoint',
          keys: {
            p256dh: 'p256-dh-key',
          },
        })
      } catch (err) {
        caught = err
      }
      expect(caught).toEqual(new InvalidPushSubscriptionError('keys.auth'))
    })

    it('should throw InvalidPushSubscriptionError if subscription has no pd256-dh key', () => {
      let caught: unknown
      try {
        iut.canonicalPushSubscriptionJson({
          endpoint: 'endpoint',
          keys: {
            auth: 'auth-key',
          },
        })
      } catch (err) {
        caught = err
      }
      expect(caught).toEqual(new InvalidPushSubscriptionError('keys.p256dh'))
    })

    it.each`
      expirationTime
      ${null}
      ${undefined}
      ${1234}
    `('should map $expirationTime correctly', ({ expirationTime }) => {
      const expected: CanonicalPushSubscriptionJSON = {
        endpoint: 'endpoint',
        keys: {
          auth: 'auth-key',
          p256dh: 'p256dh-key',
        },
      }
      if (expirationTime !== undefined && expirationTime !== null) {
        expected.expirationTime = expirationTime
      }

      expect(
        iut.canonicalPushSubscriptionJson({
          endpoint: 'endpoint',
          expirationTime,
          keys: {
            auth: 'auth-key',
            p256dh: 'p256dh-key',
          },
        }),
      ).toStrictEqual(expected)
    })
  })
})
