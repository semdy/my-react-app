import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Appear } from '@/components/AppearWrapper'

const GridViewItemContent = React.memo(props => {
  const videoRef = useRef(null)
  const nodeRef = useRef(null)
  const [tip, setTip] = useState(null)
  const timer = useRef(null)

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const setVideoOrTip = useCallback(
    tip => {
      const { videoObject } = window.netcall.getMemberObjectByAccount(props.account)
      if (videoObject) {
        videoRef.current.srcObject = videoObject
        const playPromise = videoRef.current.play()
        if (playPromise) {
          playPromise.catch(() => {})
        }
      }
      setTip(tip)
    },
    [props.account]
  )

  const handleAppear = useCallback(() => {
    const { account, myAccount, joined } = props
    const { node, videoObject, tip } = window.netcall.getMemberObjectByAccount(account)

    if (account !== myAccount && node) {
      nodeRef.current = node
      if (joined && !node.appeared) {
        clearTimer()
        timer.current = setTimeout(() => {
          window.netcall.startRemoteStreamMeetingSimply({ account, node })
        }, 2000)
      }
    }

    if (videoObject) {
      videoRef.current.srcObject = videoObject
      const playPromise = videoRef.current.play()
      if (playPromise) {
        playPromise.catch(() => {})
      }
    } else if (tip) {
      setTip(tip)
    }
  }, [props, clearTimer])

  const handleDisappear = useCallback(() => {
    const { account, myAccount, joined } = props
    if (account === myAccount || !joined) return
    videoRef.current.pause()
    if (nodeRef.current && !nodeRef.current.appeared) {
      clearTimer()
      timer.current = setTimeout(() => {
        window.netcall.stopRemoteStreamMeeting(account)
      }, 2000)
    }
  }, [props, clearTimer])

  useEffect(() => {
    const handler = e => {
      const { account, msg } = e.detail
      if (account === props.account) {
        setVideoOrTip(msg)
      }
    }

    window.addEventListener('onCameraControl', handler, false)

    return () => {
      if (!props.observerDisabled) {
        handleDisappear()
      }
      window.removeEventListener('onCameraControl', handler, false)
    }
  }, [props.observerDisabled]) // eslint-disable-line

  useEffect(() => {
    if (props.observerDisabled) {
      handleAppear()
    }
  }, [props.observerDisabled]) // eslint-disable-line

  return (
    <Appear onAppear={handleAppear} onDisappear={handleDisappear}>
      <span className="meeting-tip" id={`meetingTip-${props.account}`}>
        {tip}
      </span>
      <video
        x-webkit-airplay="x-webkit-airplay"
        playsInline="playsinline"
        webkit-playsinline="webkit-playsinline"
        muted
        ref={videoRef}
        style={{ width: '100%', height: '100%', visibility: tip ? 'hidden' : '' }}
      >
        <track kind="captions" />
      </video>
    </Appear>
  )
})

export default GridViewItemContent
