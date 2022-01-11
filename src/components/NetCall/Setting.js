import React, { useCallback, useState, useEffect } from 'react'
import { Modal, Select, Switch } from 'antd'
import Icon from '@/components/Icon'
import './Setting.less'

const { Option } = Select

const Setting = props => {
  const mediaDevices = window.netcall.getMediaDevices()
  const [devices] = useState(mediaDevices)
  const [currentVideo, setCurrentVideo] = useState(mediaDevices.currentVideo)
  const [currentAudioIn, setCurrentAudioIn] = useState(mediaDevices.currentAudioIn)
  const [currentAudioOut, setCurrentAudioOut] = useState(mediaDevices.currentAudioOut)
  const [isPlayRing, setIsPlayRing] = useState(window.netcall.isPlayRingWhenJoinOrLeave)

  const handleVideoChange = useCallback(value => {
    window.netcall.selectDevice(value, 'video')
    setCurrentVideo(value)
  }, [])

  const handleAudioInChange = useCallback(value => {
    window.netcall.selectDevice(value, 'audioIn')
    setCurrentAudioIn(value)
  }, [])

  const handleAudioOutChange = useCallback(value => {
    window.netcall.selectDevice(value, 'audioOut')
    setCurrentAudioOut(value)
  }, [])

  const handlePlayRingChange = useCallback(value => {
    window.netcall.setIsPlayRing(value)
    setIsPlayRing(value)
  }, [])

  const handleClose = useCallback(() => {
    props.onClose()
  }, [props])

  useEffect(() => {
    if (props.visible) {
      setTimeout(() => {
        window.netcall.setMyVideoView()
      })
    }
  }, [props.visible])

  return (
    <Modal
      title="设置"
      visible={props.visible}
      width={420}
      zIndex={1205}
      closable={false}
      footer={null}
      destroyOnClose
      centered
      className="darkModal"
    >
      <div className="netcall-setting-wrapper">
        <Icon name="close" className="netcall-setting-close" onClick={handleClose} />
        <div className="netcall-setting-video">
          <video
            id="netcall-setting-video"
            x-webkit-airplay="x-webkit-airplay"
            playsInline="playsinline"
            webkit-playsinline="webkit-playsinline"
            muted
          >
            <track kind="captions" />
          </video>
        </div>
        <div className="netcall-setting-block" style={{ borderBottom: props.isMeeting ? '' : 0 }}>
          <div className="netcall-setting-item">
            <span className="netcall-setting-item-label">摄像头</span>
            <Select
              value={currentVideo}
              dropdownClassName="netcall-select-dropdown"
              onChange={handleVideoChange}
            >
              {devices.video.map(item => (
                <Option value={item.deviceId} key={item.deviceId}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="netcall-setting-item">
            <span className="netcall-setting-item-label">麦克风</span>
            <Select
              value={currentAudioIn}
              dropdownClassName="netcall-select-dropdown"
              onChange={handleAudioInChange}
            >
              {devices.audioIn.map(item => (
                <Option value={item.deviceId} key={item.deviceId}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="netcall-setting-item">
            <span className="netcall-setting-item-label">扬声器</span>
            <Select
              value={currentAudioOut}
              dropdownClassName="netcall-select-dropdown"
              onChange={handleAudioOutChange}
            >
              {devices.audioOut.map(item => (
                <Option value={item.deviceId} key={item.deviceId}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        {/* <div className="netcall-setting-block">
          <div className="netcall-setting-item">
            <span className="netcall-setting-item-label">参会模式</span>
            <Select value="0" style={{ width: 112 }} dropdownClassName="netcall-select-dropdown">
              <Option value="0">标准</Option>
              <Option value="1">标准</Option>
            </Select>
          </div>
        </div> */}
        {props.isMeeting && (
          <div className="netcall-setting-item">
            <span className="netcall-setting-item-label">进出会议时播放声音提醒</span>
            <Switch checked={isPlayRing} onChange={handlePlayRingChange} />
          </div>
        )}
      </div>
    </Modal>
  )
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(Setting, isEqual)
