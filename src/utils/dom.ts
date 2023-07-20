export function createDom(el = 'div', tpl = '', attrs = {}, cname = '') {
  const dom = document.createElement(el)
  dom.className = cname
  dom.innerHTML = tpl
  Object.keys(attrs).forEach((item) => {
    const key = item
    const value = attrs[item]
    if (el === 'video' || el === 'audio') {
      if (value)
        dom.setAttribute(key, value)
    }
    else {
      dom.setAttribute(key, value)
    }
  })
  return dom
}

export function copyDom(dom: HTMLElement) {
  if (dom && dom.nodeType === 1) {
    const back = document.createElement(dom.tagName)
    Array.prototype.forEach.call(dom.attributes, (node) => {
      back.setAttribute(node.name, node.value)
    })
    if (dom.innerHTML)
      back.innerHTML = dom.innerHTML

    return back
  }

  return ''
}
