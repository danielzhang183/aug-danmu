export function styleUtil(elem: HTMLElement, name: string, value: string) {
  const style = elem.style
  try {
    style[name] = value
  }
  catch (error) {
    style.setProperty(name, value)
  }
}

export function styleCSSText(elem: HTMLElement, value: string) {
  const style = elem.style
  try {
    style.cssText = value
  }
  catch (error) {}
}
