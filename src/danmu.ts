import { Main } from './main'
import { isMobile } from './utils'

export const enum DanmuMode {
  SCROLL = 'scroll',
  TOP = 'top',
  BOTTOM = 'bottom',
}

export const enum DanmuStatus {
  IDLE = 'idle',
  PAUSED = 'paused',
  PLAYING = 'playing',
  CLOSED = 'closed',
}

export interface DanmuOptions {
  /**
   * Container
   */
  container: HTMLElement
  containerStyle?: Record<string, any>
  comments: Comment[]
  /**
   * @default scroll
   */
  mode?: DanmuMode
  /**
   * @default r21
   */
  direction?: 'r21' | 'b2t'
  /**
   * @default 5000
   */
  duration?: number
  /**
   * Interval of caching danmu
   * @default 2000 ms
   */
  interval?: number
  /**
   * Allow danmu overlap
   * @default false
   */
  overlap?: boolean
  /**
   * Show danmu immediately
   * @default true
   */
  immediate?: boolean
  /**
   * Danmu Display Area
   */
  area: {
    start: 0
    end: 1
    lines: 1
  }
  /**
   * @default true
   */
  highScorePriority?: boolean
  /**
   * @default true
   */
  chaseEffect?: boolean
  /**
   * @default false
   */
  needResizeObserver?: boolean
  /**
   * Channel Size
   * @default 10/12 px
   */
  channelSize?: number
}

export const defaultDanmuOptions = <DanmuOptions>{
  mode: 'scroll',
  direction: 'r21',
  duration: 5000,
  interval: 2000,
  overlap: false,
  immediate: true,
  area: {
    start: 0,
    end: 1,
    lines: 1,
  },
  highScorePriority: true,
  chaseEffect: true,
  needResizeObserver: false,
  channelSize: isMobile ? 10 : 12,
}

export function resolveDanmuOptions(options: DanmuOptions) {
  return {
    ...defaultDanmuOptions,
    ...options,
  }
}

export class Danmu {
  main: Main | undefined
  container: HTMLElement
  comments: Comment[] = []
  config: DanmuOptions
  isReady = false

  constructor(
    DanmuOptions: DanmuOptions,
  ) {
    this.main = new Main(this)
    const options = resolveDanmuOptions(DanmuOptions)
    this.container = options.container
    this.comments = options.comments
    this.config = options
    this.isReady = true
  }

  start() {
    this.main?.start()
  }

  stop() {
    this.main?.stop()
  }

  pause() {
    this.main?.pause()
  }

  play() {
    this.main?.play()
  }

  clear() {
    this.main?.clear()
  }

  destroy() {

  }

  get status() {
    return this.main!.status
  }

  get state() {
    const main = this.main!
    return {
      status: main.status,
      comments: main.data,
      bullets: main.queue,
      displayArea: main.channel.getRealOccupyArea(),
    }
  }

  get containerPos() {
    return this.main!.channel.containerPos
  }
}
