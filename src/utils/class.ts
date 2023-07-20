export function hasClass(el: HTMLElement, className: string) {
  if (el.classList)
    return Array.prototype.some.call(el.classList, item => item === className)
  else
    return !!el.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`))
}

export function addClass(el: HTMLElement, className: string) {
  if (el.classList) {
    className
      .replace(/(^\s+|\s+$)/g, '')
      .split(/\s+/g)
      .forEach((item) => {
        item && el.classList.add(item)
      })
  }
  else if (!hasClass(el, className)) {
    el.className += ` ${className}`
  }
}

export function removeClass(el: HTMLElement, className: string) {
  if (el.classList) {
    className.split(/\s+/g).forEach((item) => {
      el.classList.remove(item)
    })
  }
  else if (hasClass(el, className)) {
    className.split(/\s+/g).forEach((item) => {
      const reg = new RegExp(`(\\s|^)${item}(\\s|$)`)
      el.className = el.className.replace(reg, ' ')
    })
  }
}

export function toggleClass(el: HTMLElement, className: string) {
  className.split(/\s+/g).forEach((item) => {
    if (hasClass(el, item))
      removeClass(el, item)

    else
      addClass(el, item)
  })
}
