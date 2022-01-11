import React from 'react'
import { Carousel } from 'antd'
import './index.less'

const UserSlider = () => (
  <Carousel autoplay>
    <div className="one">
      <h3>&nbsp;</h3>
    </div>
    <div className="two">
      <h3>&nbsp;</h3>
    </div>
    <div className="three">
      <h3>&nbsp;</h3>
    </div>
    <div className="four">
      <h3>&nbsp;</h3>
    </div>
  </Carousel>
)

export default React.memo(UserSlider)
