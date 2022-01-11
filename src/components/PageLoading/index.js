import React from 'react'
import { Spin } from 'antd'

export default React.memo(() => (
  <div
    style={{ position: 'fixed', left: 0, right: 0, top: '30%', textAlign: 'center', zIndex: 1000 }}
  >
    <Spin size="large" />
  </div>
))
