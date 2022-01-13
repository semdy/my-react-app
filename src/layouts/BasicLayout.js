import React, { useCallback, useEffect, useState, useRef } from 'react'
import { connect, useDispatch } from 'react-redux'
import { NavLink, useHistory, useLocation } from 'react-router-dom'
import DocumentTitle from 'react-document-title'
import { Dropdown, Badge, Tooltip } from 'antd'
import AppLogo from '@/components/AppLogo'
import AppInvite from '@/components/AppInvite'
import AppNavMore from '@/components/AppNavMore'
import Icon from '@/components/Icon'
import Avatar from '@/components/Avatar'
// import TeamSelector from '@/components/TeamSelector'
import PersonalCard from '@/components/PersonalCard'
import AppUserStatus from '@/components/Tag/AppUserStatus'
import WaterMark from '@/components/WaterMark'
import GlobalContext from '@/context/GlobalContext'
import * as im from '@/models/im'
import { showNetCall } from '@/components/NetCall/model'
import useRefreshCalendar from '@/hooks/calendar'
import useUserGuideShow from '@/components/UserGuide/hooks/useUserGuideShow'
import { useUserGuide, USER_GUIDE_SCOPE } from '@/components/UserGuide'
// import { install as installScreenShot } from '@/plugins/screenshot'
import { install as installAppGlobalEvents } from '@/utils/appWindow'
import teamManager from '@/services/memory/teamManager'
import styles from './BasicLayout.module.less'

const GlobalModals = React.lazy(() => import('./GlobalModals'))
const GlobalSearch = React.lazy(() => import('@/components/GlobalSearch'))
const NetCall = React.lazy(() => import('@/components/NetCall'))
const Reminder = React.lazy(() => import('@/components/Reminder'))
const MyStatus = React.lazy(() => import('@/components/MyStatus'))
const NoviceGuidance = React.lazy(() => import('@/components/NoviceGuidance'))

const AppBarUserAvatar = connect(({ im: { user, imInfo }, app: { updateAvailable } }) => ({
  userAvatar: user.myInfo.avatar || imInfo.teamMemberIcon || imInfo.teamMemberName,
  updateAvailable
}))(
  React.memo(({ userAvatar, updateAvailable }) => {
    return (
      <>
        <Avatar className={styles.appBarAvatar} url={userAvatar} />
        {updateAvailable && <i className={styles.appBarUserDot} />}
      </>
    )
  })
)

const AppBarUser = React.memo(() => {
  const [dropVisible, setDropVisible] = useState(false)
  const [guideRef] = useUserGuide(USER_GUIDE_SCOPE.IM, 0)
  const [adminGuideRef] = useUserGuide(USER_GUIDE_SCOPE.ADMIN, 0)

  const handleVisible = useCallback(visible => {
    setDropVisible(visible)
  }, [])

  const handleInvisible = useCallback(() => {
    handleVisible(false)
  }, [handleVisible])

  const handleRef = useCallback(
    ref => {
      guideRef.current = ref
      adminGuideRef.current = ref
    },
    [guideRef, adminGuideRef]
  )

  return (
    <div className={styles.appBarUserMain}>
      {dropVisible && <div className="personalCard-mask" />}
      <Dropdown
        trigger={['click']}
        placement="topLeft"
        visible={dropVisible}
        overlayClassName="personalCard-dropdown-wrap"
        align={{
          offset: [55, 0]
        }}
        onVisibleChange={handleVisible}
        overlay={() => <PersonalCard visible={dropVisible} onClose={handleInvisible} />}
      >
        <div ref={handleRef} className={styles.appBarUser}>
          <AppBarUserAvatar />
          <AppUserStatus />
        </div>
      </Dropdown>
    </div>
  )
})

const UnReadCounter = connect(
  ({
    im: {
      session: { sessionList }
    }
  }) => ({
    totalUnread: sessionList.reduce((prev, cur) => {
      if (typeof cur.localCustom === 'object') {
        if (cur.localCustom.mute) {
          return prev
        }
      }
      return prev + (+cur.unread || 0)
    }, 0)
  })
)(
  React.memo(({ totalUnread, children }) => {
    if (process.env.REACT_APP_TYPE === 'mac' || process.env.REACT_APP_TYPE === 'linux') {
      // eslint-disable-next-line
      useEffect(() => {
        const { app } = require('electron').remote
        app.badgeCount = totalUnread

        return () => {
          app.badgeCount = 0
        }
      }, [totalUnread])
    }

    return (
      <Badge count={totalUnread} overflowCount={99}>
        {children}
      </Badge>
    )
  })
)

const AppBarNavs = connect(({ im: { imInfo } }) => ({
  imInfo,
  knowledgeStatus: imInfo && imInfo.knowledgeStatus ? imInfo.knowledgeStatus : 1,
  hasIm: teamManager.getConfig('hasIm'),
  hasWork: teamManager.getConfig('hasWork')
}))(
  React.memo(({ imInfo, knowledgeStatus, hasIm, hasWork }) => {
    const [navs, setNavs] = useState([])
    const [activeIndex, setActiveIndex] = useState(-1)
    const [calGuideRef, updateCalGuide] = useUserGuide(USER_GUIDE_SCOPE.CALENDAR, 0)
    const [cloudGuideRef, updateCloudGuide] = useUserGuide(USER_GUIDE_SCOPE.CLOUD, 0)
    const [knowledgeGuideRef, updateKnowledgeGuide] = useUserGuide(USER_GUIDE_SCOPE.KNOWLEDGE, 0)

    const history = useHistory()
    const location = useLocation()

    const handleActiveIndex = useCallback(
      path => {
        setActiveIndex(navs.findIndex(nav => path.startsWith(nav.path)))
      },
      [navs]
    )

    const handleRef = useCallback(
      (ref, nav) => {
        if (ref) {
          if (nav.path === '/calendar') {
            calGuideRef.current = ref
            updateCalGuide(ref)
          } else if (nav.path === '/cloud') {
            cloudGuideRef.current = ref
            updateCloudGuide(ref)
          } else if (nav.path === '/knowledge') {
            knowledgeGuideRef.current = ref
            updateKnowledgeGuide(ref)
          }
        }
      },
      [
        calGuideRef,
        cloudGuideRef,
        knowledgeGuideRef,
        updateCalGuide,
        updateCloudGuide,
        updateKnowledgeGuide
      ]
    )

    const getNavs = useCallback(
      (more = false) => {
        const navMap = {
          101: hasWork && { path: '/dashboard', icon: 'work', title: '工作台', id: 101 },
          111: hasIm && { path: '/chat', icon: 'chat', title: '消息', id: 111 },
          121: { path: '/contacts', icon: 'contacts', title: '联系人', id: 121 },
          131: { path: '/calendar', icon: 'calendar', title: '日历', id: 131 },
          141: { path: '/cloud', icon: 'cloud', title: '云空间', id: 141 },
          151: knowledgeStatus === 2 && {
            path: '/knowledge',
            icon: 'knowledge',
            title: '知识库',
            id: 151
          },
          161: hasIm && { path: '/favorites', icon: 'fav', title: '收藏', id: 161 }
        }

        if (!more && imInfo.menuLayoutList) {
          return imInfo.menuLayoutList.map(item => navMap[item.id]).filter(Boolean)
        }
        if (more && imInfo.notConfigLayouts) {
          return imInfo.notConfigLayouts.map(item => navMap[item.id]).filter(Boolean)
        }

        return Object.keys(navMap)
          .map(item => navMap[item])
          .filter(Boolean)
      },
      [imInfo.menuLayoutList, imInfo.notConfigLayouts, hasIm, hasWork, knowledgeStatus]
    )

    useEffect(() => {
      setNavs(getNavs())
    }, [getNavs])

    useEffect(() => {
      handleActiveIndex(location.pathname)
      return history.listen(location => {
        handleActiveIndex(location.pathname)
      })
    }, []) // eslint-disable-line

    return (
      <div className={styles.appBarNav}>
        {navs.map((nav, i) => (
          <Tooltip placement="right" title={nav.title} key={nav.path}>
            <NavLink
              className={styles.appBarItem}
              activeClassName="selected"
              to={nav.path}
              ref={ref => handleRef(ref, nav)}
            >
              {nav.path === '/chat' ? (
                <UnReadCounter>
                  <Icon name={`${nav.icon}-${activeIndex === i ? 't' : 't'}`} size="22px" />
                </UnReadCounter>
              ) : (
                <Icon name={`${nav.icon}-${activeIndex === i ? 't' : 't'}`} size="22px" />
              )}
            </NavLink>
          </Tooltip>
        ))}
        <AppNavMore navs={navs} setNavs={setNavs} imInfo={imInfo} getNavs={getNavs} />
      </div>
    )
  })
)

const NativeAppHeader = (() => {
  if (process.env.REACT_APP_TYPE === 'win') {
    const { AppHeader } = require('@/components/natives')
    return AppHeader
  }
  return React.Fragment
})()

const BasicLayoutChildren = connect(({ app: { loginingTeam } }) => ({
  loginingTeam
}))(
  React.memo(
    ({ loginingTeam, children }) => {
      return !loginingTeam && <div className={styles.appContent}>{children}</div>
    },
    (prevProps, nextProps) => {
      return nextProps.loginingTeam === prevProps.loginingTeam
    }
  )
)

const BasicLayout = React.memo(({ children }) => {
  const dispatch = useDispatch()
  const context = useRef({})

  useRefreshCalendar()
  useUserGuideShow()

  useEffect(() => {
    dispatch(im.connect({ force: true }))
    context.current.showNetCall = payload => {
      showNetCall(payload)
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    window.name = 'imsdomMainWin'
    // const unInstallScreenShot = installScreenShot()
    const unInstallAppGlobalEvents = installAppGlobalEvents()

    return () => {
      document.body.style.overflow = ''
      window.name = undefined
      // unInstallScreenShot()
      unInstallAppGlobalEvents()
    }
  }, [])

  if (process.env.REACT_APP_ENV === 'electron') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return require('@/components/natives').nativeEventsInstall()
    }, [])
  }

  return (
    <DocumentTitle title="IMSDOM">
      <div className={styles.appLayout}>
        <WaterMark />
        <div className={styles.appBar}>
          <AppLogo />
          <AppBarNavs />
          {/* <TeamSelector /> */}
          <AppInvite />
          <AppBarUser />
        </div>
        <div className={styles.appMain}>
          <NativeAppHeader />
          <GlobalContext.Provider value={context.current}>
            <BasicLayoutChildren>{children}</BasicLayoutChildren>
            <React.Suspense fallback={null}>
              <NetCall />
            </React.Suspense>
            <React.Suspense fallback={null}>
              <GlobalModals />
            </React.Suspense>
            <React.Suspense fallback={null}>
              <GlobalSearch />
            </React.Suspense>
            <React.Suspense fallback={null}>
              <Reminder />
            </React.Suspense>
            <React.Suspense fallback={null}>
              <MyStatus />
            </React.Suspense>
            <React.Suspense fallback={null}>
              <NoviceGuidance />
            </React.Suspense>
          </GlobalContext.Provider>
        </div>
      </div>
    </DocumentTitle>
  )
})

export default BasicLayout
