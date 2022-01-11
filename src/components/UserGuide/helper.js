export function getDomBounding(dom) {
  if (!dom) {
    return null
  }
  const pageXOffset =
    window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft
  const pageYOffset =
    window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop
  const bound = dom.getBoundingClientRect()
  return {
    left: bound.left + pageXOffset,
    top: bound.top + pageYOffset,
    width: bound.width,
    height: bound.height
  }
}

export function isDomVisible(element) {
  if (!element) {
    return false
  }

  if (element.offsetParent) {
    return true
  }

  if (element.getBBox) {
    const box = element.getBBox()
    if (box.width || box.height) {
      return true
    }
  }

  if (element.getBoundingClientRect) {
    const box = element.getBoundingClientRect()
    if (box.width || box.height) {
      return true
    }
  }

  return false
}
