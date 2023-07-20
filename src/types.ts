import type { DanmuMode } from './danmu'

export interface BulletOptions {
  id: string
  start: number
  duration: number
  prior: boolean
  /**
   * High Score, high priority
   */
  score?: number
  txt?: string
  el?: HTMLElement | Function
  /**
   * 配置了elLazyInit后，则通过hooks提供的时机进行el创建，该方式可减少dom数量
   */
  elLazyInit?: boolean
  mode: DanmuMode
  /**
   * Mark danmu is already on track
   * @internal
   */
  attached_: boolean
  /**
   * @default false
   */
  realTime?: boolean
  color?: string
  bookChannelId?: [number, any]
}

export interface GlobalHooks {
  bulletCreateEl?: (bullet: BulletOptions) => HTMLElement | { el: HTMLElement } & GlobalHooks
  bulletAttaching?: (bullet: BulletOptions) => void
  bulletAttached?: (bullet: BulletOptions) => void
  bulletDetaching?: (bullet: BulletOptions) => void
  bulletDetached?: (bullet: BulletOptions, el: HTMLElement) => void
}
