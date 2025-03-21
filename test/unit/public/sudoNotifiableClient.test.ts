/*
 * Copyright © 2025 Anonyome Labs, Inc. All rights reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { DefaultLogger } from '@sudoplatform/sudo-common'
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when,
} from 'ts-mockito'
import { SudoPlatformPayload } from '../../../src/private/codecs/sudoPlatformPayloadCodec'
import { DuplicateNotifiableClientError } from '../../../src/public/errors'
import {
  DefaultSudoNotifiableClient,
  SudoNotifiableClient,
} from '../../../src/public/sudoNotifiableClient'
import { SudoNotification } from '../../../src/public/types/sudoNotification'
import { SudoNotificationData } from '../../../src/public/types/sudoNotificationData'

// These WebWorker types seem not visible with this Jest context so re-derive them
// from our usage of them so we can define our mocks
type PushEvent = Parameters<DefaultSudoNotifiableClient['extractData']>[0]
type PushMessageData = Exclude<PushEvent['data'], null>

export class TestNotification1 extends SudoNotification {
  public static readonly instance = new TestNotification1()

  public constructor() {
    super('mockNotifiableClient1', 'TestNotification1')
  }
}

export class TestNotification2 extends SudoNotification {
  public static readonly instance = new TestNotification2()

  public constructor() {
    super('mockNotifiableClient2', 'TestNotification2')
  }
}

describe('DefaultSudoNotifiableClient', () => {
  const mockNotifiableClient1 = mock<SudoNotifiableClient>()
  const mockNotifiableClient2 = mock<SudoNotifiableClient>()
  const mockPushEvent = mock<PushEvent>()
  const mockPushMessageData = mock<PushMessageData>()

  let iut: DefaultSudoNotifiableClient

  beforeEach(() => {
    reset(mockNotifiableClient1)
    when(mockNotifiableClient1.serviceName).thenReturn('mockNotifiableClient1')
    when(mockNotifiableClient1.decode(anything())).thenReturn(
      TestNotification1.instance,
    )

    reset(mockNotifiableClient2)
    when(mockNotifiableClient2.serviceName).thenReturn('mockNotifiableClient2')
    when(mockNotifiableClient2.decode(anything())).thenReturn(
      TestNotification2.instance,
    )

    reset(mockPushEvent)
    reset(mockPushMessageData)
    when(mockPushEvent.data).thenReturn(instance(mockPushMessageData))

    iut = new DefaultSudoNotifiableClient(
      [instance(mockNotifiableClient1), instance(mockNotifiableClient2)],
      new DefaultLogger('debug'),
    )
  })

  describe('constructor', () => {
    it('should throw an exception if multiple SudoNotifiableClients for same service are provided', () => {
      let caught: unknown
      try {
        new DefaultSudoNotifiableClient(
          [instance(mockNotifiableClient1), instance(mockNotifiableClient1)],
          new DefaultLogger('debug'),
        )
      } catch (err) {
        caught = err
      }
      expect(caught).toEqual(
        new DuplicateNotifiableClientError('mockNotifiableClient1'),
      )
    })
  })

  describe('extractData', () => {
    it('should return undefined if PushEvent has no data', () => {
      when(mockPushEvent.data).thenReturn(null)
      expect(iut.extractData(instance(mockPushEvent))).toBeUndefined()

      verify(mockPushEvent.data).atLeast(1)
      verify(mockPushMessageData.json()).never()
    })

    it('should return undefined if accessing PushEvent data as json throws an error', () => {
      when(mockPushEvent.data).thenReturn(instance(mockPushMessageData))
      when(mockPushMessageData.json()).thenThrow(new Error('Boom!'))

      expect(iut.extractData(instance(mockPushEvent))).toBeUndefined()

      verify(mockPushEvent.data).atLeast(1)
      verify(mockPushMessageData.json()).once()
    })

    it('should return undefined if payload is not a sudoplatform notification payload', () => {
      when(mockPushEvent.data).thenReturn(instance(mockPushMessageData))
      when(mockPushMessageData.json()).thenReturn({ not: 'sudoplatform' })

      expect(iut.extractData(instance(mockPushEvent))).toBeUndefined()

      verify(mockPushEvent.data).atLeast(1)
      verify(mockPushMessageData.json()).once()
    })

    it('should return undefined if servicename is falsy', () => {
      const payload: SudoPlatformPayload = {
        sudoplatform: {
          servicename: '',
          data: 'foo',
          other: 'property',
        },
      }

      when(mockPushEvent.data).thenReturn(instance(mockPushMessageData))
      when(mockPushMessageData.json()).thenReturn(payload)

      expect(iut.extractData(instance(mockPushEvent))).toBeUndefined()

      verify(mockPushEvent.data).atLeast(1)
      verify(mockPushMessageData.json()).once()
    })

    it('should return expected data from valid payload', () => {
      const data = new SudoNotificationData('servicename', 'foo')
      const payload: SudoPlatformPayload = {
        sudoplatform: {
          servicename: data.serviceName,
          data: data.data,
          other: 'property',
        },
      }

      when(mockPushEvent.data).thenReturn(instance(mockPushMessageData))
      when(mockPushMessageData.json()).thenReturn(payload)

      const result = iut.extractData(instance(mockPushEvent))
      expect(result).toBeInstanceOf(SudoNotificationData)
      expect(result).toEqual(data)

      verify(mockPushEvent.data).atLeast(1)
      verify(mockPushMessageData.json()).once()
    })
  })

  describe('decodeData', () => {
    it('should return undefined if service is not recognised', () => {
      const data = new SudoNotificationData('unknown', 'data')

      expect(iut.decodeData(data)).toBeUndefined()

      verify(mockNotifiableClient1.decode(anything())).never()
      verify(mockNotifiableClient2.decode(anything())).never()
    })

    it('should return undefined if there is no data', () => {
      const data = new SudoNotificationData('mockNotifiableClient1', undefined)

      expect(iut.decodeData(data)).toBeUndefined()

      verify(mockNotifiableClient1.decode(anything())).never()
      verify(mockNotifiableClient2.decode(anything())).never()
    })

    it('should invoke correct notifiable client decode method', () => {
      const data1 = new SudoNotificationData(
        'mockNotifiableClient1',
        'data to decode',
      )

      const data2 = new SudoNotificationData(
        'mockNotifiableClient2',
        'data to decode',
      )

      expect(iut.decodeData(data1)).toEqual(TestNotification1.instance)

      verify(mockNotifiableClient1.decode(anything())).once()

      const [actualData1] = capture(mockNotifiableClient1.decode).first()
      expect(actualData1).toEqual(data1.data)

      verify(mockNotifiableClient2.decode(anything())).never()

      expect(iut.decodeData(data2)).toEqual(TestNotification2.instance)

      verify(mockNotifiableClient1.decode(anything())).once()

      verify(mockNotifiableClient2.decode(anything())).once()
      const [actualData2] = capture(mockNotifiableClient2.decode).first()
      expect(actualData2).toEqual(data1.data)
    })
  })
})
