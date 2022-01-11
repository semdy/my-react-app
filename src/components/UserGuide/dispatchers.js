import teamManager from '@/services/memory/teamManager'
import { dispatchCustomEvent } from '@/utils/utils'

export function completeUserGuide() {
  if (teamManager.getConfig('hasUserGuide')) {
    dispatchCustomEvent('userGuideComplete')
  }
}

export function terminateUserGuide() {
  if (teamManager.getConfig('hasUserGuide')) {
    dispatchCustomEvent('userGuideTerminate')
  }
}

export function goNextUserGuide() {
  if (teamManager.getConfig('hasUserGuide')) {
    dispatchCustomEvent('userGuideToNext')
  }
}

export function updateUserGuideTasks() {
  if (teamManager.getConfig('hasUserGuide')) {
    dispatchCustomEvent('updateUserGuideTasks')
  }
}
