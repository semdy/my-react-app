let scrollTimer = null

const page = {
  // 滚动聊天列表到底部
  scrollChatListDown: (dom, pos, initCount) => {
    if (!dom) return
    const maxCount = 5
    // eslint-disable-next-line no-param-reassign
    initCount = initCount || 1
    if (typeof pos !== 'number') {
      // eslint-disable-next-line no-param-reassign
      pos = Math.max(page.getChatMaxScrollTop(dom), 888888)
    }
    dom.scrollTop = pos
    if (dom.scrollTop < pos && initCount < maxCount) {
      clearTimeout(scrollTimer)
      scrollTimer = setTimeout(() => {
        // eslint-disable-next-line no-param-reassign
        initCount++
        page.scrollChatListDown(dom, pos, initCount)
      }, 200)
    }
  },
  getChatListHeight: dom => {
    return dom.scrollHeight
  },
  getChatClientHeight: dom => {
    return dom.clientHeight
  },
  getChatMaxScrollTop: dom => {
    return page.getChatListHeight(dom) - page.getChatClientHeight(dom)
  },
  getChatListScroll: dom => {
    return dom.scrollTop
  }
}

export default page
