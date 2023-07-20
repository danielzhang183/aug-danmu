/* eslint-disable @typescript-eslint/no-this-alias */
import { Channel } from './channel'
import type { Danmu } from './danmu'
import { DanmuStatus } from './danmu'
import type { Bullet } from './bullet'
import type { BulletOptions } from './types'

// 单次尝试入轨弹幕数量越多，长任务及CPU耗时越多
const MAX_TRY_COUNT = 0

export const enum RetryStatus {
  NORMAL = 'normal',
  STOP = 'stop',
}

export interface MainOptions {
  /**
   * @default 1
   */
  playRate: number
}

export class Main {
  container: Danmu['container']
  channel: Channel
  data: Bullet[] = []
  playRate = 1
  interval = 2000
  queue: Bullet[] = []
  retryStatus: RetryStatus = RetryStatus.NORMAL
  private playedData: BulletOptions[] = []
  private timer: NodeJS.Timeout | null = null
  private timerId: number | null = null
  private _status: DanmuStatus = DanmuStatus.IDLE
  private _events: Array<[HTMLElement, string, Function]> = []

  constructor(public danmu: Danmu) {
    this.container = danmu.container
    this.channel = new Channel(danmu)
    this.data = danmu.comments
    this.interval = danmu.config.interval || 2000
  }

  get status() {
    return this._status
  }

  init() {
    const self = this
    self.sortData()

    function handleData() {
      if (
        self._status === DanmuStatus.CLOSED && self.retryStatus === RetryStatus.STOP
      ) {
        self._cancelHandleDataTimer()
        return
      }
      if (self._status === DanmuStatus.PLAYING) {
        self.readData()
        self.handleData()
      }
      if (self.retryStatus !== RetryStatus.STOP || self._status === DanmuStatus.PAUSED) {
        self.timer = setTimeout(() => {
          // 在下一帧开始时进行绘制，最大程度减少卡顿
          self.timerId = requestAnimationFrame(() => handleData())
        }, 250)
      }
    }
    handleData()
  }

  start() {

  }

  stop() {

  }

  play() {

  }

  pause() {

  }

  clear() {

  }

  destroy() {

  }

  sortData() {
    this.data.sort((prev, cur) => (prev.start || -1) - (cur.start || -1))
  }

  readData() {
    const self = this
    const { danmu } = self
    if (!danmu.isReady || !danmu.main)
      return
  }

  handleData() {
    const self = this
    if (this._status === DanmuStatus.PAUSED || this._status === DanmuStatus.CLOSED)
      return

    if (self.queue.length)
      self.queue.forEach(i => i.status === 'waiting' && i.startMove())
  }

  private _cancelHandleDataTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
