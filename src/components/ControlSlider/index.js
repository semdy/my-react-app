import React, { useCallback, useState } from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import { Dropdown, Slider } from 'antd'
import './index.less'

const ControlSlider = React.memo(
  ({ className, defaultValue, disabled, onChange, children, ...reset }) => {
    const [value, setValue] = useState(defaultValue)
    const handleChange = useCallback(
      value => {
        setValue(value)
        onChange(value)
      },
      [onChange]
    )

    const SliderOverlay = (
      <div
        className={classNames('control-slider-wrapper', className)}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="control-slider-text">{value}</div>
        <div className="control-slider-inner">
          <Slider
            className="control-slider"
            vertical
            tooltipVisible={false}
            value={value}
            onChange={handleChange}
            {...reset}
          />
        </div>
      </div>
    )

    return disabled ? (
      children
    ) : (
      <Dropdown placement="topCenter" transitionName="" overlay={SliderOverlay}>
        {children}
      </Dropdown>
    )
  }
)

ControlSlider.defaultProps = {
  className: '',
  onChange: () => {},
  min: 0,
  max: 10,
  defaultValue: 10,
  disabled: false
}

ControlSlider.propTypes = {
  className: propTypes.string,
  onChange: propTypes.func,
  min: propTypes.number,
  max: propTypes.number,
  defaultValue: propTypes.number,
  disabled: propTypes.bool
}

export default ControlSlider
