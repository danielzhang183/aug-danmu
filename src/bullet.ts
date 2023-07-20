/* eslint-disable @typescript-eslint/no-this-alias */
import type { Danmu } from './danmu'
import { DanmuMode } from './danmu'
import type { BulletOptions, GlobalHooks } from './types'
import { copyDom, isFunction, isNumber, styleCSSText, styleUtil } from './utils'

export const enum BulletStatus {
  WAITING = 'waiting',
  START = 'start',
  END = 'end',
}

export function resolveBulletOptions(options: BulletOptions): Required<BulletOptions> {
  return {
    ...options,
    mode: options.mode || DanmuMode.SCROLL,
    realTime: options.realTime || false,
  }
}

/**
 * [Bullet 弹幕构造类]
 *
 * @description
 *  1. 几乎所有事件都可以被代理（包括CSS事件），Bullet内不要进行事件绑定。所有事件绑定均在main层处理
 */
export class Bullet {
  id: string
  start: number
  duration = 2000
  prior = false
  status: BulletStatus
  mode: DanmuMode
  color: string
  realTime = false
  reuseDOM = true
  hooks: GlobalHooks
  options: BulletOptions
  el: HTMLElement | undefined
  elPos: DOMRect | undefined
  width = 0
  height = 0
  private container: Danmu['container']
  private _fullySlideInScreenDuration = 0
  private _lastMoveTime = 0
  private _moveV = 0

  constructor(
    private danmu: Danmu,
    options: BulletOptions = {},
  ) {
    const { container, recycler, config } = danmu
    this.danmu = danmu
    this.container = container
    this.options = resolveBulletOptions(options)
    /** @type {number} - milliseconds */
    this.duration = options.duration
    this.id = options.id
    this.start = options.start
    this.prior = options.prior
    this.color = options.color
    this.mode = options.mode
    this.realTime = options.realTime
    this.bookChannelId = options.bookChannelId
    this.noCopyEl = !!(config.disableCopyDOM || options.disableCopyDOM)
    this.recycler = recycler
    this._fullySlideInScreenDuration = undefined
    this._lastMoveTime = undefined
    this.hooks = {
      // Bullet内只记录一个离屏 hook，这个钩子使用起来很容易产生副作用，需要业务侧严格管理比如闭包清理
      bulletDetached: () => {},
    }
    this.status = BulletStatus.WAITING

    if (!options.elLazyInit)
      this._makeEl()
  }

  get moveV() {
    const self = this
    const { danmu, options } = self
    let v = self._moveV

    if (!v) {
      if (options.moveV) {
        v = options.moveV
      }
      else {
        if (self.elPos) {
          const ctPos = danmu.containerPos
          const distance
            = self.direction === 'b2t'
              ? ctPos.height + (danmu.config.chaseEffect ? self.height : 0)
              : ctPos.width + (danmu.config.chaseEffect ? self.width : 0)

          v = (distance / self.duration) * 1000
        }
      }

      if (v) {
        v *= danmu.main!.playRate

        // 固化速度，否则resize时外部获取当前弹幕时会重新计算速度，导致布局异常（重叠），同时提高性能。
        self._moveV = v
      }
    }
    return v
  }

  get direction() {
    return this.danmu.direction
  }

  get fullySlideIntoScreen() {
    const self = this
    let flag = true

    if (self.mode === 'scroll' && self._lastMoveTime && self._fullySlideInScreenDuration > 0) {
      const now = new Date().getTime()
      const diff = (now - self._lastMoveTime) / 1000

      if (diff >= self._fullySlideInScreenDuration)
        flag = true

      else
        flag = false
    }
    return flag
  }

  private _makeEl() {
    const { danmu, options } = this
    const { config, globalHooks } = danmu
    /**
     * @type {HTMLElement}
     */
    let el
    let cssText = ''
    const style = options.style || {}

    // The use of translate3d pushes css animations into hardware acceleration for more power!
    // Use 'perspective' to try to fix flickering problem after switching to the transform above
    style.perspective = '500em'

    // !!! 'backface-visibility' will cause translateX/Y stop rendering in firefox
    // style['backfaceVisibility'] = 'hidden'
    // style['webkitBackfaceVisibility'] = 'hidden'

    if (options.el || options.elLazyInit) {
      if (this.noCopyEl)
        this.reuseDOM = false

      if (options.elLazyInit) {
        if (isFunction(globalHooks.bulletCreateEl)) {
          try {
            const result = globalHooks.bulletCreateEl(options)

            if (result instanceof HTMLElement) {
              el = result
            }
            else {
              el = result.el

              if (isFunction(result.bulletDetached))
                this.hooks.bulletDetached = result.bulletDetached
            }
          }
          catch (e) {}
        }
      }
      else {
        if (options.el.nodeType === 1 && !options.el.parentNode) {
          if (this.reuseDOM) {
            const copyDOM = copyDom(options.el)
            if (options.eventListeners && options.eventListeners.length > 0) {
              options.eventListeners.forEach((eventListener) => {
                copyDOM.addEventListener(eventListener.event, eventListener.listener, eventListener.useCapture || false)
              })
            }
            el = this.recycler.use()
            if (el.childNodes.length > 0)
              el.innerHTML = ''

            if (el.textContent)
              el.textContent = ''

            el.appendChild(copyDOM)
          }
          else {
            el = options.el
          }
        }
      }
    }
    else if (typeof options.txt === 'string') {
      el = this.recycler.use()
      el.textContent = options.txt
    }

    if (!el)
      return { bulletCreateFail: true }

    let offset
    if (isNumber(config.bulletOffset) && config.bulletOffset >= 0) {
      offset = config.bulletOffset
    }
    else {
      const containerPos = danmu.containerPos
      offset = containerPos.width / 10 > 100 ? 100 : containerPos.width / 10
    }
    const random = options.realTime ? 0 : Math.floor(Math.random() * offset)
    const left = this.updateOffset(random, true)

    style.left = left
    Object.keys(style).forEach((key) => {
      const bbqKey = key.replace(/[A-Z]/g, (val) => {
        return `-${val.toLowerCase()}`
      })
      cssText += `${bbqKey}:${style[key]};`
    })
    styleCSSText(el, cssText)

    /**
     * @type {HTMLElement}
     */
    this.el = el
    if (options.like && options.like.el)
      this.setLikeDom(options.like.el, options.like.style)
  }

  updateOffset(val: number, dryRun = false) {
    this.random = val
    const left = `${this.danmu.containerPos.width + val}px`

    if (!dryRun)
      styleUtil(this.el, 'left', `${this.danmu.containerPos.width + val}px`)

    return left
  }

  attach() {
    const self = this

    if (self.options.elLazyInit && !self.el)
      self._makeEl()

    const { danmu, options, el } = self
    const { globalHooks } = danmu

    if (globalHooks.bulletAttaching)
      globalHooks.bulletAttaching(options)

    if (!self.container.contains(el))
      self.container.appendChild(el)

    self.elPos = el.getBoundingClientRect()
    if (self.direction === 'b2t') {
      self.width = self.elPos.height
      self.height = self.elPos.width
    }
    else {
      self.width = self.elPos.width
      self.height = self.elPos.height
    }
    if (self.moveV)
      self.duration = ((self.danmu.containerPos.width + self.random + self.width) / self.moveV) * 1000

    if (globalHooks.bulletAttached)
      globalHooks.bulletAttached(options, el)
  }

  detach() {
    // this.logger && this.logger.info(`detach #${this.options.txt || '[DOM Element]'}#`)
    const self = this
    const { el, danmu, options, hooks } = self
    const { globalHooks } = danmu

    if (el) {
      // run hooks
      if (globalHooks.bulletDetaching)
        globalHooks.bulletDetaching(options)

      if (self.reuseDOM) {
        self.recycler.unused(el)
      }
      else {
        if (el.parentNode)
          el.parentNode.removeChild(el)
      }

      // run hooks
      if (hooks.bulletDetached) {
        hooks.bulletDetached(options, el)
        delete hooks.bulletDetached
      }
      if (globalHooks.bulletDetached)
        globalHooks.bulletDetached(options, el)

      self.el = null
    }

    self.elPos = undefined
  }

  topInit() {
    if (this.direction === 'b2t') {
      styleUtil(this.el, 'transformOrigin', 'left top')
      styleUtil(
        this.el,
        'transform',
        `translateX(-${this.top}px) translateY(${this.danmu.containerPos.height}px) translateZ(0px) rotate(90deg)`,
      )
      styleUtil(this.el, 'transition', 'transform 0s linear 0s')
    }
    else {
      styleUtil(this.el, 'top', `${this.top}px`)
    }
  }

  setFontSize(size: string) {
    if (this.el)
      this.el.style.fontSize = size
  }

  setLikeDom(el, style) {
    if (el) {
      Object.keys(style).forEach((key) => {
        el.style[key] = style[key]
      })
      const likeClass = 'danmu-like'
      el.className = likeClass
      if (this.el) {
        const children = this.el.querySelector(`.${likeClass}`)
        if (children)
          this.el.removeChild(children)

        this.el.innerHTML = `${this.el.innerHTML}${el.outerHTML}`
      }
    }
    return el
  }
}

export default Bullet
