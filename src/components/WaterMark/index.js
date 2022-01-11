import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import watermark from 'watermark-dom'
import useEnableAuth from '@/hooks/useEnableAuth'
import './index.less'

const WaterMark = React.memo(({ text, defaultWatermark, featureIds }) => {
  const enableWaterMark = useEnableAuth(featureIds, 4003)

  useEffect(() => {
    if (!text || defaultWatermark === 0 || !enableWaterMark) return

    const setting = {
      watermark_txt: text,
      watermark_fontsize: '12px',
      watermark_color: '#646473',
      watermark_alpha: 0.06,
      watermark_x_space: 100,
      watermark_angle: 30
    }
    watermark.init(setting)

    function remove() {
      watermark.remove()
    }

    return remove
  }, [text, defaultWatermark, enableWaterMark])

  return <></>
})

const mapStateToProps = ({
  im: {
    user: {
      myInfo: { account = '', nick = '' }
    },
    imInfo: { teamMemberName, teamMemberId, defaultWatermark = 0, featureIds = [] }
  }
}) => {
  account = account || teamMemberId
  nick = nick || teamMemberName
  return {
    text: account ? `${nick} ${account.slice(-12)}` : localStorage.getItem('water_mark'),
    defaultWatermark,
    featureIds
  }
}

export default connect(mapStateToProps)(WaterMark)
