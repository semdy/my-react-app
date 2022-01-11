import React from 'react'
import { Trans } from '@/locales'

export const imUIStack = [
  {
    canSkip: true,
    showStep: false,
    goNextOnClose: false,
    placement: 'rightBottom',
    pageRouter: '',
    overlayClassName: 'user-guide-avatar',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00013" defaultMessage="进入个人设置" />
        </div>
      )
    }
  },
  {
    showStep: false,
    showFooter: false,
    placement: 'top',
    pageRouter: '',
    overlayClassName: 'user-guide-avatar',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00014" defaultMessage="点此换上您帅气的照片" />
        </div>
      )
    }
  }
]

export const inviteUIStack = [
  {
    showStep: false,
    showFooter: false,
    goNextOnClose: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00015" defaultMessage="复制链接来邀请您的小伙伴加入吧" />
        </div>
      )
    }
  },
  {
    showStep: false,
    showFooter: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00016" defaultMessage="复制此链接并发送给好友" />
        </div>
      )
    }
  }
]

export const adminUIStack = [
  {
    canSkip: true,
    showStep: false,
    goNextOnClose: false,
    placement: 'rightBottom',
    pageRouter: '',
    overlayClassName: 'user-guide-avatar',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00017" defaultMessage="进入个人设置" />
        </div>
      )
    }
  },
  {
    showStep: false,
    showFooter: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00018" defaultMessage="管理员可进入团队管理后台" />
        </div>
      )
    }
  }
]

export const calUIStack = [
  {
    canSkip: true,
    showStep: false,
    goNextOnClose: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00019" defaultMessage="进入日历" />
        </div>
      )
    }
  },
  {
    canMoveNext: true,
    canSkip: true,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00020" defaultMessage="您可新建主题日历或订阅他人公开的日历" />
        </div>
      )
    }
  },
  {
    canSkip: true,
    placement: 'topRight',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00021" defaultMessage="新增一个日程" />
        </div>
      )
    }
  },
  {
    canMoveNext: true,
    canSkip: true,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00022" defaultMessage="邀请参与此日程的小伙伴" />
        </div>
      )
    }
  },
  {
    showFooter: true,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans
            id="UserGuide.00023"
            defaultMessage="您可在此输入及搜索与此日程相关的文档或知识库"
          />
        </div>
      )
    }
  }
]

export const cloudUIStack = [
  {
    canSkip: true,
    goNextOnClose: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00024" defaultMessage="进入云空间" />
        </div>
      )
    }
  },
  {
    canMoveNext: true,
    canMovePrev: false,
    canSkip: true,
    placement: 'bottomRight',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00025" defaultMessage="您可上传电脑里的文档到云空间" />
        </div>
      )
    }
  },
  {
    showFooter: true,
    placement: 'bottomRight',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans
            id="UserGuide.00026"
            defaultMessage="也可新建空白文档，或使用我们提供的模板建立文档"
          />
        </div>
      )
    }
  }
]

export const knowledgeUIStack = [
  {
    canSkip: true,
    goNextOnClose: false,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00027" defaultMessage="进入知识库" />
        </div>
      )
    }
  },
  {
    canMoveNext: true,
    canSkip: true,
    placement: 'topLeft',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00028" defaultMessage="您可在这里查看我们的知识库范例" />
        </div>
      )
    }
  },
  {
    canMoveNext: true,
    canSkip: true,
    placement: 'bottomRight',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00029" defaultMessage="你也可订阅其他伙伴建立的公开知识库" />
        </div>
      )
    }
  },
  {
    goNextOnClose: false,
    // removeInst: false,
    placement: 'bottomRight',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00030" defaultMessage="现在新建属于您的知识库吧" />
        </div>
      )
    }
  }
]

export const knowledgeEditUIStack = [
  {
    canMoveNext: true,
    canSkip: true,
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <>
          <div>
            <Trans id="UserGuide.00031" defaultMessage="知识库就像是一本书" />
          </div>
          <div>
            <Trans id="UserGuide.00032" defaultMessage="现在点此新增知识库目录，并输入目录名称" />
          </div>
        </>
      )
    }
  },
  {
    canSkip: true,
    canMoveNext: true,
    placement: 'bottom',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00033" defaultMessage="您可从云空间或电脑上导入文档" />
        </div>
      )
    }
  },
  {
    placement: 'right',
    pageRouter: '',
    layout: () => {
      return (
        <div>
          <Trans id="UserGuide.00034" defaultMessage="或是建立空白文档、表格、PPT、多媒体文件" />
        </div>
      )
    }
  }
]
