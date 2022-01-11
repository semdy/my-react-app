import React, { useState, useCallback, useEffect } from 'react'
import classNames from 'classnames'
import { message } from 'antd'
import ControlSlider from '@/components/ControlSlider'
import IconButton from '@/components/IconButton'
import { durationManager } from '@/components/NetCall/hooks'
import { openNewCloudWindowCenter } from '@/utils/space'
import { useNetCallReducer } from './model'
import styles from './MeetingVideoControls.module.less'

const FileModal = React.lazy(() =>
  import('@/components/OfficeCallUI/EditorUI/CommonUI/GlobalModal/fileModal')
)

function computeVolume(value) {
  return parseInt((255 * value) / 10, 10)
}

function revertVolume(value) {
  return parseInt((value / 255) * 10, 10)
}

const MeetingVideoControls = props => {
  const [state] = useNetCallReducer()
  const [playVolume] = useState(revertVolume(window.netcall.getPlayVolume()))
  const [captureVolume] = useState(revertVolume(window.netcall.getCaptureVolume()))
  // eslint-disable-next-line no-unused-vars
  const [shareDocInfo, setShareDocInfo] = useState(false)
  const [fileModalVisible, setFileModalVisible] = useState(false)
  const { shareDoc, shareDocRedPoint } = state

  const switchAudioIn = useCallback(() => {
    if (state.caller !== state.myAccount) {
      if (state.meetingMuted) {
        message.info('主持人已开启全员静音')
        return
      }
    }
    window.netcall.switchAudioIn()
  }, [state.meetingMuted, state.caller, state.myAccount])

  const switchAudioOut = useCallback(() => {
    window.netcall.switchAudioOut()
  }, [])

  const switchCamera = useCallback(() => {
    window.netcall.switchCamera()
  }, [])

  const startSharing = useCallback(() => {
    // window.netcall.startSharing()
    setFileModalVisible(true)
  }, [])

  const joinSharing = useCallback(() => {
    setShareDocInfo(prev => !prev)
  }, [])

  const joinShareDoc = useCallback(() => {
    openNewCloudWindowCenter(`#/office/file?file=${shareDoc.fileId}&position=1`, shareDoc.fileId)
    window.netcall.confirmJoinSharing()
  }, [shareDoc])

  const openFile = useCallback(() => {
    openNewCloudWindowCenter(`#/office/file?file=${shareDoc.fileId}`, shareDoc.fileId)
  }, [shareDoc])

  const fileModalConfirm = useCallback(fileId => {
    window.netcall.startSharing(fileId[0], () => setFileModalVisible(false))
    window.netcall.confirmJoinSharing()
  }, [])

  const fileModalCancel = useCallback(() => {
    setFileModalVisible(false)
  }, [])

  const microphoneAfterChange = useCallback(
    value => {
      window.netcall.setCaptureVolume(computeVolume(value))
      if (value <= 0) {
        window.netcall.switchAudioIn()
      } else if (props.microphoneDisabled) {
        window.netcall.switchAudioIn()
      }
    },
    [props.microphoneDisabled]
  )

  const volumeAfterChange = useCallback(
    value => {
      window.netcall.setPlayVolume(computeVolume(value))
      if (value <= 0) {
        window.netcall.switchAudioOut()
      } else if (props.volumeDisabled) {
        window.netcall.switchAudioOut()
      }
    },
    [props.volumeDisabled]
  )

  const handleShareScreen = useCallback(() => {
    window.netcall.switchShareScreen()
  }, [])

  useEffect(() => {
    durationManager.onEnd(state.channelName, props.onHangUp)
  }, [state.channelName, props.onHangUp])

  return (
    <div
      className={classNames('netcall-window-controls', {
        hide: !props.visible,
        hasSider: props.hasSider
      })}
      onMouseMove={props.onMouseMove}
    >
      <ControlSlider
        disabled={props.microphoneNoDevice}
        defaultValue={captureVolume}
        onAfterChange={microphoneAfterChange}
      >
        <IconButton
          name={props.microphoneDisabled ? 'unvoice-f' : 'voice-f'}
          title={props.microphoneTitle}
          className={classNames('netcall-button microphone', {
            'no-device': props.microphoneNoDevice
          })}
          onClick={switchAudioIn}
        />
      </ControlSlider>
      <ControlSlider
        disabled={props.volumeNoDevice}
        defaultValue={playVolume}
        onAfterChange={volumeAfterChange}
      >
        <IconButton
          name={props.volumeDisabled ? 'unvolume-f' : 'volume-f'}
          title={props.volumeTitle}
          className={classNames('netcall-button volume', {
            'no-device': props.volumeNoDevice
          })}
          onClick={switchAudioOut}
        />
      </ControlSlider>
      <IconButton
        name={props.cameraDisabled ? 'unvideo-f' : 'video-f'}
        title={props.cameraTitle}
        className={classNames('netcall-button camera', {
          'no-device': props.cameraNoDevice
        })}
        onClick={switchCamera}
      />
      <IconButton
        name="share-screen"
        title={
          props.isShareScreen
            ? '停止共享屏幕'
            : props.cameraDisabled
            ? '请先开启摄像头再共享屏幕'
            : '共享屏幕'
        }
        className={classNames('netcall-button share', {
          disabled: props.cameraDisabled
        })}
        onClick={handleShareScreen}
      />
      {state.status === 'meeting' && (
        <div className={styles.ShareDocBtnWrapper}>
          {shareDocRedPoint && <div className={styles.redPoint} />}
          {shareDocInfo && shareDoc.sharing && shareDoc.isTeacher && (
            <div className={styles.shareDocInfo}>
              <div className={styles.text}>你正在联动</div>
              {shareDoc.fileName && (
                <div className={styles.fileNameBtn} onClick={openFile}>
                  [{shareDoc.fileName}]
                </div>
              )}
              <div className={styles.text}>，无法继续发起</div>
            </div>
          )}
          {shareDocInfo && shareDoc.sharing && !shareDoc.isTeacher && (
            <div className={styles.shareDocInfo}>
              <div className={styles.text}> {shareDoc.inviter}正在发起文档[</div>
              <div className={styles.fileName}>{shareDoc.fileName}</div>
              <div className={styles.text}>]的联动，</div>
              <div className={styles.textBtn} onClick={joinShareDoc}>
                点击进入
              </div>
            </div>
          )}
          <IconButton
            name="meeting-sharedoc"
            title="文档联动"
            className="netcall-button"
            onClick={shareDoc.sharing ? joinSharing : startSharing}
          />
          {fileModalVisible && (
            <React.Suspense fallback={null}>
              <FileModal
                visible
                title="选择新的文档"
                hint="请选择要联动的新文档，一次最多可以联动一个文档"
                multiple={false}
                onConfirm={fileModalConfirm}
                onCancel={fileModalCancel}
              />
            </React.Suspense>
          )}
        </div>
      )}
      <IconButton
        name="hangup-f"
        title="挂断"
        className="netcall-button red-plain"
        onClick={props.onHangUp}
      />
    </div>
  )
}

const isEqual = (prevProps, nextProps) => {
  if (nextProps.visible) {
    return false
  }
  return nextProps.visible === prevProps.visible
}

export default React.memo(MeetingVideoControls, isEqual)
