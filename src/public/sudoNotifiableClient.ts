/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import { isLeft } from 'fp-ts/lib/Either'
import { PathReporter } from 'io-ts/PathReporter'
import { SudoPlatformPayloadCodec } from '../private/codecs/sudoPlatformPayloadCodec'
import { DuplicateNotifiableClientError } from './errors'
import { SudoNotification } from './types/sudoNotification'
import { SudoNotificationData } from './types/sudoNotificationData'

/**
 * Client used to decode service specific notification data. Each Sudo Platform
 * service SDK that has notifications provides an implementation of this protocol
 * that must be passed to {@link DefaultSudoNotifiableClient} on construction.
 */
export interface SudoNotifiableClient {
  /**
   * Name of service for the implementing Sudo Platform SDK. Matches the corresponding service's configuration
   * section within sudoplatformconfig.json
   */
  serviceName: string

  /**
   * Decode opaque, serialized service specific notification data
   *
   * @param data Opaque, serialized service specific notification data
   *
   * @returns
   *    Service specific implementation of {@link SudoNotification}
   *    decoded from the data
   */
  decode(data: string): SudoNotification
}

/**
 * Client used to decode notification payload data specific to Sudo Platform services used by an application
 *
 * This client is light weight and suitable for use within a Notification Extension
 */
export class DefaultSudoNotifiableClient {
  private readonly notifiableClients: Record<string, SudoNotifiableClient>

  /**
   * Construct a new instance
   *
   *  @param notifiableClients
   *    Array of SudoNotifiableClient implementations. Provide one for each Sudo Platform
   *    notification emitting service consumed by your application.
   *
   *  @throws {@link DuplicateNotifiableClientError}
   *    if more than one {@link SudoNotifiableClient} is provided for a particular
   *    Sudo Platform service.
   */
  public constructor(
    notifiableClients: SudoNotifiableClient[],
    private readonly logger = new DefaultLogger('DefaultSudoNotifiableClient'),
  ) {
    this.notifiableClients = {}

    notifiableClients.forEach((notifiableClient) => {
      if (this.notifiableClients[notifiableClient.serviceName]) {
        throw new DuplicateNotifiableClientError(notifiableClient.serviceName)
      }
      this.notifiableClients[notifiableClient.serviceName] = notifiableClient
    })
  }

  /**
   * Extract encoded Sudo Platform notification specific data from a Web Push API PushEvent
   * if it is present.
   *
   *  @param event PushEvent to extract data from
   *
   *  @returns If the notification payload contains Sudo Platform notification specific data, a
   *    {@link SudoNotificationData} is returned that should then be passed to {@link decodeData}.
   *    If no Sudo Platform notification specific data is present, then undefined is returned.
   */
  public extractData(event: PushEvent): SudoNotificationData | undefined {
    let payload: unknown
    let payloadErr: unknown
    try {
      payload = event.data?.json()
    } catch (err) {
      payloadErr = err
    }
    if (!payload) {
      this.logger.debug(
        'Not handling notification that does not contain a JSON payload',
        { err: payloadErr, data: event.data },
      )
      return undefined
    }

    const sudoplatformPayloadDecodeResult =
      SudoPlatformPayloadCodec.decode(payload)
    if (isLeft(sudoplatformPayloadDecodeResult)) {
      this.logger.debug(
        'Not handling notification that cannot be decoded as a SudoPlatform payload',
        { errors: PathReporter.report(sudoplatformPayloadDecodeResult) },
      )
      return undefined
    }
    const sudoplatform = sudoplatformPayloadDecodeResult.right.sudoplatform

    const serviceName = sudoplatform.servicename
    if (!serviceName) {
      this.logger.debug(
        'Not handling notification without sudoplatform.servicename',
      )
      return undefined
    }

    const data = sudoplatform.data

    return new SudoNotificationData(serviceName, data)
  }

  /**
   * Decode Sudo Notification specific data to a service specific instance of a SudoNotification
   * Calls the {@link SudoNotifiableClient.decode} method of the service specific
   * {@link SudoNotifiableClient}
   *
   * @param data {@link SudoNotificationData} to decode
   *
   * @returns
   *    Service specific implementation of {@link SudoNotification} or undefined if
   *    data contains no data to decode
   */
  public decodeData(data: SudoNotificationData): SudoNotification | undefined {
    const notifiableClient = this.notifiableClients[data.serviceName]
    if (!notifiableClient) {
      this.logger.debug(
        `No registered notifiable client for service ${data.serviceName} notification`,
        { registered: Object.keys(this.notifiableClients) },
      )
      return undefined
    }

    const dataToDecode = data.data
    if (!dataToDecode) {
      this.logger.debug(
        `No data to decode for ${data.serviceName} notification`,
      )
      return undefined
    }

    this.logger.debug(`Decoding notification for service ${data.serviceName}`)
    return notifiableClient.decode(dataToDecode)
  }
}
