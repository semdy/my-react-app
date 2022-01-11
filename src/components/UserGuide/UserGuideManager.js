import UserGuide from './UserGuide'
import {
  imUIStack,
  cloudUIStack,
  inviteUIStack,
  adminUIStack,
  calUIStack,
  knowledgeUIStack,
  knowledgeEditUIStack
} from './UIStack'

export const USER_GUIDE_SCOPE = {
  IM: 'im',
  CLOUD: 'cloud',
  INVITE: 'invite',
  ADMIN: 'admin',
  CALENDAR: 'calendar',
  KNOWLEDGE: 'knowledge',
  KNOWLEDGE_EDIT: 'knowledgeEdit'
}

export const userGuideManager = {
  stack: {},
  getInstance(scope) {
    return this.stack[scope]
  },
  addInstance(scope, instance) {
    this.stack[scope] = instance
  },
  getAllInstance() {
    return this.stack
  },
  removeInstance(scope) {
    const inst = this.getInstance(scope)
    if (inst) {
      inst.destroy()
      delete this.stack[scope]
    }
  },
  clearInstance() {
    Object.keys(this.stack).forEach(scope => {
      this.removeInstance(scope)
    })
  }
}

export function createIMGuideInstance() {
  const imInst = new UserGuide(USER_GUIDE_SCOPE.IM)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.IM, imInst)
  imInst.setUIStack(imUIStack)
  return imInst
}

export function createInviteGuideInstance() {
  const inviteInst = new UserGuide(USER_GUIDE_SCOPE.INVITE)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.INVITE, inviteInst)
  inviteInst.setUIStack(inviteUIStack)
  return inviteInst
}

export function createAdminGuideInstance() {
  const adminInst = new UserGuide(USER_GUIDE_SCOPE.ADMIN)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.ADMIN, adminInst)
  adminInst.setUIStack(adminUIStack)
  return adminInst
}

export function createCalGuideInstance() {
  const calInst = new UserGuide(USER_GUIDE_SCOPE.CALENDAR)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.CALENDAR, calInst)
  calInst.setUIStack(calUIStack)
  return calInst
}

export function createCloudGuideInstance() {
  const cloudInst = new UserGuide(USER_GUIDE_SCOPE.CLOUD)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.CLOUD, cloudInst)
  cloudInst.setUIStack(cloudUIStack)
  return cloudInst
}

export function createKnowledgeGuideInstance() {
  const knowledgeInst = new UserGuide(USER_GUIDE_SCOPE.KNOWLEDGE)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.KNOWLEDGE, knowledgeInst)
  knowledgeInst.setUIStack(knowledgeUIStack)
  return knowledgeInst
}

export function createKnowledgeEditGuideInstance() {
  const knowledgeEditInst = new UserGuide(USER_GUIDE_SCOPE.KNOWLEDGE_EDIT)
  userGuideManager.addInstance(USER_GUIDE_SCOPE.KNOWLEDGE_EDIT, knowledgeEditInst)
  knowledgeEditInst.setUIStack(knowledgeEditUIStack)
  return knowledgeEditInst
}
