const { remote } = require('electron')

const { Menu, MenuItem } = remote

// 获取选中内容
function getSelection() {
  let text = ''
  if (window.getSelection) {
    // 除IE9以下 之外的浏览器
    text = window.getSelection().toString()
  } else if (document.selection && document.selection.type !== 'Control') {
    // IE9以下，可不考虑
    text = document.selection.createRange().text
  }
  if (text) {
    return text
  }
}

function bindAppGlobalContextMenu() {
  // new一个菜单
  const handler = function(e) {
    const curElement = document.activeElement
    const { tagName } = curElement
    const isEditable = curElement.getAttribute('contenteditable') !== null
    const contextMenus = []
    // ↓ 情况一：任何情况下，都显示 复制 和 粘贴 按钮
    // 添加菜单功能, label: 菜单名称， accelerator：快捷键，click：点击方法
    const selectStr = getSelection() // 选中的内容
    if (selectStr) {
      // menu.append(new MenuItem({ label: '复制1', click: copyString }))
      contextMenus.push(
        new MenuItem({
          label: '复制',
          role: 'copy'
        })
      )
    }

    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || isEditable) {
      // // 添加菜单分割线
      // // menu.append(new MenuItem({ type: 'separator' }))
      // // 添加菜单功能
      // menu.append(new MenuItem({ label: '粘贴1', click: printString }))
      contextMenus.push(
        new MenuItem({
          label: '粘贴',
          role: 'paste'
        })
      )
    }

    // // ↑ 情况一

    if (contextMenus.length > 0) {
      e.preventDefault()
      const menu = new Menu()
      contextMenus.forEach(menuItem => {
        menu.append(menuItem)
      })
      menu.popup(remote.getCurrentWindow())
      contextMenus.length = 0
    }

    /*
    // ↓ 情况二：可复制时，显示复制，可粘贴时显示粘贴
    let flag = false // menu中是否有菜单项，true有，false没有
    const { tagName } = document.activeElement // 焦点元素的tagName
    const str = clipboard.readText() // 剪贴板中的内容
    const selectStr = getSelection() // 选中的内容
    const text = e.target.innerText || '' // 目标标签的innerText
    const value = e.target.value || '' // 目标标签的value

    if (selectStr) {
      // 如果有选中内容
      flag = true
      // 在 选中的元素或者输入框 上面点右键，这样在选中后点别处就不会出现右键复制菜单
      if (text.indexOf(selectStr) !== -1 || value.indexOf(selectStr) !== -1)
        menu.append(new MenuItem({ label: '复制', click: copyString }))
    }
    if (str && (tagName === 'INPUT' || tagName === 'TEXTAREA')) {
      // 若为输入框 且 剪贴板中有内容，则显示粘贴菜单
      flag = true
      menu.append(new MenuItem({ label: '粘贴', click: printString }))
    }

    // ↑ 情况二

    // menu中有菜单项 且（有选中内容 或 剪贴板中有内容）
    if (flag && (getSelection() || str)) {
      // if (flag) {
      // 将此menu菜单作为 当前窗口 remote.getCurrentWindow() 中的上下文菜单弹出。
      menu.popup(remote.getCurrentWindow())
    }
    */
  }

  // 监听contextmenu，实现自定义右键菜单
  window.addEventListener('contextmenu', handler, false)

  return () => {
    window.removeEventListener('contextmenu', handler, false)
  }
}

//   // 写入剪贴板方法
//   function copyString() {
//     const str = getSelection() // 获取选中内容
//     clipboard.writeText(str) // 写入剪贴板
//   }
//   // 获取剪贴版内容写入当前焦点元素中
//   function printString() {
//     if (document.activeElement) {
//       const { className } = document.activeElement
//       if (className === 'w-e-text') {
//         const formats = clipboard.availableFormats()
//         if (formats.length === 0) {
//           return
//         }
//         const type = formats[0]
//         let str
//         switch (type) {
//           case 'image/png':
//             const dataURL = clipboard.readImage().toDataURL()
//             str = `<img src="${dataURL}" style="max-height:180px;max-width:180px;"/>`
//             Event.emit('addValueWithoutShapeToRichText', str)
//             break
//           case 'text/html':
//             let content = clipboard.readHTML()
//             const others = content.match(/(?:<[\s\S]+?>)|(?:<\/[\s\S]+?>)/g)
//             content = content.replace(/>\r\n/g, '>')
//             if (others) {
//               others.forEach(other => {
//                 if (other.startsWith('<img')) return
//                 content = content.replace(other, '')
//               })
//             }
//             const imgs = content.match(/<img.+?>/g)
//             if (imgs && imgs.length === 1) {
//               content = content.replace('<img', '<img style="max-height:180px;max-width:180px;"')
//               Event.emit('addValueWithoutShapeToRichText', content)
//             }
//             break
//           default:
//             str = clipboard.readText()
//             Event.emit('addValueToRichText', str)
//         }
//       } else {
//         document.activeElement.value = clipboard.readText() // 写入焦点元素
//       }
//       // clipboard.clear() // 清空剪贴板
//     }
//   }

export default bindAppGlobalContextMenu
