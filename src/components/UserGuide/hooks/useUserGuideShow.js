import { useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import teamManager from '@/services/memory/teamManager'
import { initUserGuide, unMountUserGuide } from '../index'
import userGuideIndicator from '../UserGuideIndicator'
import {
  USER_GUIDE_SCOPE,
  userGuideManager,
  createIMGuideInstance,
  createInviteGuideInstance,
  createAdminGuideInstance,
  createCalGuideInstance,
  createCloudGuideInstance,
  createKnowledgeGuideInstance,
  createKnowledgeEditGuideInstance
} from '../UserGuideManager'

function clearGuideInstance() {
  userGuideManager.clearInstance()
}

function destroyGuide() {
  unMountUserGuide()
  clearGuideInstance()
}

function useUserGuideShow(showFloat = true, instScope) {
  const loginingTeam = useSelector(state => state.app.loginingTeam)

  const createInstance = useCallback(scope => {
    switch (scope) {
      case USER_GUIDE_SCOPE.IM:
        return createIMGuideInstance()
      case USER_GUIDE_SCOPE.CALENDAR:
        return createCalGuideInstance()
      case USER_GUIDE_SCOPE.CLOUD:
        return createCloudGuideInstance()
      case USER_GUIDE_SCOPE.ADMIN:
        return createAdminGuideInstance()
      case USER_GUIDE_SCOPE.INVITE:
        return createInviteGuideInstance()
      case USER_GUIDE_SCOPE.KNOWLEDGE:
        return createKnowledgeGuideInstance()
      case USER_GUIDE_SCOPE.KNOWLEDGE_EDIT:
        return createKnowledgeEditGuideInstance()
      default:
      //
    }
  }, [])

  useEffect(() => {
    if (!loginingTeam) {
      const hasUserGuide = teamManager.getConfig('hasUserGuide')
      const isExternal = teamManager.getConfig('isExternal')
      if (!isExternal) {
        destroyGuide()
        initUserGuide(showFloat, hasUserGuide)
        if (hasUserGuide && instScope) {
          setTimeout(() => {
            createInstance(instScope).show()
          }, 1000)
        }
      }
    }
  }, [createInstance, instScope, loginingTeam, showFloat])

  useEffect(() => {
    let resizeHandler = null
    let terminateHandler = null

    if (!loginingTeam && teamManager.getConfig('hasUserGuide')) {
      resizeHandler = () => {
        userGuideIndicator.refresh()
        const instStack = userGuideManager.getAllInstance()
        Object.keys(instStack).forEach(scope => {
          instStack[scope].refresh()
        })
      }
      terminateHandler = () => {
        clearGuideInstance()
        window.removeEventListener('resize', resizeHandler, false)
        window.removeEventListener('userGuideTerminate', terminateHandler)
      }
      window.addEventListener('resize', resizeHandler, false)
      window.addEventListener('userGuideTerminate', terminateHandler)
    }

    return () => {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler, false)
        window.removeEventListener('userGuideTerminate', terminateHandler)
      }
    }
  }, [loginingTeam])

  useEffect(() => {
    return () => {
      // if (teamManager.getConfig('hasUserGuide')) {
      destroyGuide()
      userGuideIndicator.destroy()
      // }
    }
  }, [])
}

export default useUserGuideShow
