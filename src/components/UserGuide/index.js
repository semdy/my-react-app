import React from 'react'
import ReactDOM from 'react-dom'
import LocaleWrapper from '@/locales/Wrapper'
import Provider from './model/Provider'
import UserGuidePopover from './UserGuidePopover'
import FloatHint from './FloatHint'
import FloatModal from './FloatModal'

let container

function initUserGuideComponent(showFloat, showPopover) {
  container = document.createElement('div')
  document.body.appendChild(container)
  ReactDOM.render(
    <LocaleWrapper>
      <Provider>
        {showFloat && (
          <>
            <FloatHint />
            <FloatModal />
          </>
        )}
        {showPopover && <UserGuidePopover />}
      </Provider>
    </LocaleWrapper>,
    container
  )
}

export * from './UserGuideManager'
export * from './dispatchers'
export { default as useUserGuide } from './hooks/useUserGuide'
export { default as useModalUserGuide } from './hooks/useModalUserGuide'

export function initUserGuide(showFloat, showPopover) {
  initUserGuideComponent(showFloat, showPopover)
}

export function unMountUserGuide() {
  try {
    if (container) {
      ReactDOM.unmountComponentAtNode(container)
      document.body.removeChild(container)
      container = null
    }
  } catch (e) {
    //
  }
}
