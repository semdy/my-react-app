import { useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import teamManager from '@/services/memory/teamManager'
import userGuideIndicator from '../UserGuideIndicator'
import { userGuideManager } from '../UserGuideManager'

function useUserGuide(scope, order, triggerNext, removeOnUnMount) {
  const domRef = useRef(null)
  const loginingTeam = useSelector(state => state.app.loginingTeam)

  const updateItem = dom => {
    if (/* !loginingTeam && */ teamManager.getConfig('hasUserGuide')) {
      userGuideIndicator.updateItem(scope, dom || domRef.current, order)
    }
  }

  useEffect(() => {
    if (!loginingTeam && teamManager.getConfig('hasUserGuide')) {
      userGuideIndicator.addItem(scope, domRef.current, order)
      if (triggerNext) {
        // setTimeout(() => {
        const inst = userGuideManager.getInstance(scope)
        if (inst) {
          // inst.next()
          inst.show(order)
        }
        // }, 700)
      }
    }
  }, [scope, order, triggerNext, loginingTeam])

  useEffect(() => {
    if (removeOnUnMount && teamManager.getConfig('hasUserGuide')) {
      return () => {
        userGuideIndicator.removeItem(scope, order)
      }
    }
  }, []) // eslint-disable-line

  return [domRef, updateItem]
}

export default useUserGuide
