export const isNumber = (val: any): val is number => typeof val === 'number'
export const isFunction = <T extends Function> (val: any): val is T => typeof val === 'function'

export const isMobile = /mobile/gi.test(navigator.userAgent)
