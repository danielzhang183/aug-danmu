/* eslint-disable @typescript-eslint/no-this-alias */
import type { Bullet } from './bullet'
import { type Danmu, DanmuMode } from './danmu'
import { isMobile, isNumber } from './utils'

export interface InternalChannel {
  id: number
  queue: {
    scroll: Bullet[]
    top: Bullet[]
    bottom: Bullet[]
  }
  operating: {
    scroll: boolean
    top: boolean
    bottom: boolean
  }
  bookId: Record<string, any>
}

export class Channel {
  width = 0
  height = 0
  direction = 'r21'
  /**
   * Container Property
   */
  container: Danmu['container'] | undefined
  containerPos: DOMRect | undefined
  containerWidth = 0
  containerHeight = 0
  containerTop = 0
  containerBottom = 0
  containerLeft = 0
  containerRight = 0
  /**
   * Channel Property
   */
  channelCount = 0
  channelWidth = 0
  channelHeight = 0
  channels: InternalChannel[] = []
  resetId: number | null = null

  constructor(private danmu: Danmu) {
    this.danmu = danmu
    this.container = danmu.container
    this.reset(true)
    this.updatePos()
  }

  getRealOccupyArea() {
    return {
      width: this.width,
      height: this.height,
    }
  }

  checkAvailableTrack(mode = DanmuMode.SCROLL) {
    const { channels } = this
    let flag = false

    if (mode === DanmuMode.SCROLL) {
      for (let i = 0, channel; i < channels.length; i++) {
        channel = channels[i]
        flag = true
        if (channel.operating[mode]) {
          flag = false
          continue
        }

        // 当前轨道 - 最后入轨弹幕
        const curBullet = channel.queue[mode][0]
        if (curBullet && !curBullet.fullySlideIntoScreen) {
          flag = false
          continue
        }
        if (flag)
          break
      }
    }
    else {
      flag = true
    }

    return flag
  }

  reset(isInit = false) {
    const self = this
    function channelReset() {
      if (!self.danmu?.container)
        return

      const { container } = self.danmu
      const size = container.getBoundingClientRect()
      self.width = size.width
      self.height = size.height

      if (self.resetId) {
        cancelAnimationFrame(self.resetId)
        self.resetId = null
      }

      const { channelSize, channelCount, channels } = self._initChannels()

      self.channelCount = channelCount
      self.channels = channels
      if (self.direction === 'b2t')
        self.channelWidth = channelSize
      else
        self.channelHeight = channelSize
    }

    if (isInit)
      this.resetId = requestAnimationFrame(channelReset)
    else
      channelReset()
  }

  updatePos() {
    const pos = this.container!.getBoundingClientRect()

    this.containerPos = pos
    this.containerWidth = pos.width
    this.containerHeight = pos.height
    this.containerTop = pos.top
    this.containerRight = pos.right
    this.containerBottom = pos.bottom
    this.containerLeft = pos.left
  }

  private _initChannels() {
    const self = this
    const { config } = self.danmu
    const channelSize = config.channelSize || (isMobile ? 10 : 12)
    let channelCount: number | undefined

    if (config.area) {
      const { lines, start, end } = config.area
      if (validAreaLineRule(lines)) {
        channelCount = lines
        if (self.direction === 'b2t')
          self.width = channelCount * channelSize
        else
          self.height = channelCount * channelSize
      }
      else {
        if (start >= 0 && end >= start) {
          const modulus = end - start
          if (self.direction === 'b2t')
            self.width = Math.floor(self.width * modulus)
          else
            self.height = Math.floor(self.height * modulus)
        }
      }
    }

    if (!isNumber(channelCount)) {
      if (self.direction === 'b2t')
        channelCount = Math.floor(self.width / channelSize)
      else
        channelCount = Math.floor(self.height / channelSize)
    }

    const channels = []
    for (let i = 0; i < channelCount; i++) {
      channels[i] = <InternalChannel>{
        id: i,
        queue: {
          scroll: [],
          top: [],
          bottom: [],
        },
        operating: {
          scroll: false,
          top: false,
          bottom: false,
        },
        bookId: {},
      }
    }

    return {
      channelSize,
      channelCount,
      channels,
    }
  }
}

function validAreaLineRule(line: unknown) {
  return typeof line === 'number' && line >= 0 && Number.isInteger(line)
}
