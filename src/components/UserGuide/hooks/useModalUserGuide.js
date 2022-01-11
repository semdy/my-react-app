import { useEffect } from 'react'
import teamManager from '@/services/memory/teamManager'
import useUserGuide from './useUserGuide'
import { userGuideManager } from '../UserGuideManager'

function useModalUserGuide(scope, order, triggerNext, visible, autoDestroy, removeOnUnMount) {
  const [guideRef, updateUserGuide] = useUserGuide(scope, 1, triggerNext, removeOnUnMount)

  useEffect(() => {
    if (teamManager.getConfig('hasUserGuide')) {
      if (visible) {
        setTimeout(() => {
          updateUserGuide()
          setTimeout(() => {
            const inst = userGuideManager.getInstance(scope)
            if (inst) {
              inst.next()
            }
          }, 100)
        }, 600)
      } else {
        const inst = userGuideManager.getInstance(scope)
        if (inst) {
          inst.hide()
          if (autoDestroy) {
            userGuideManager.removeInstance(scope)
          }
        }
      }
    }
  }, [visible, updateUserGuide, scope, autoDestroy, order, removeOnUnMount])

  return [guideRef, updateUserGuide]
}

export default useModalUserGuide
