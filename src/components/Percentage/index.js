import React, { useEffect, useRef } from 'react'
import propTypes from 'prop-types'
import isequal from 'lodash/isEqual'
import omit from 'omit.js'
import PercentageCore from './core'

const Percentage = props => {
  const canvasRef = useRef(null)
  const percentageIns = useRef(null)

  useEffect(() => {
    percentageIns.current = new PercentageCore(
      canvasRef.current,
      omit(props, ['className', 'style'])
    )
  }, []) // eslint-disable-line

  useEffect(() => {
    const options = omit(props, ['className', 'style'])
    Object.keys(options).forEach(key => {
      percentageIns.current[key] = options[key]
    })
  }, [props])

  return (
    <canvas
      ref={canvasRef}
      width={props.radius * 2 + props.borderWidth}
      height={props.radius * 2 + props.borderWidth}
      className={props.className}
      style={props.style}
    />
  )
}

Percentage.defaultProps = {
  className: '',
  style: {},
  borderWidth: 1,
  baseColor: '#fff',
  borderColor: '#b4c7e7',
  color: '#5bc9f4',
  radius: 30,
  percent: 0,
  type: 'sector',
  withAnimation: false
}

/* eslint-disable react/no-unused-prop-types */
Percentage.propTypes = {
  className: propTypes.string,
  style: propTypes.oneOfType([propTypes.string, propTypes.object]),
  borderWidth: propTypes.number,
  baseColor: propTypes.string,
  borderColor: propTypes.string,
  color: propTypes.string,
  radius: propTypes.number,
  percent: propTypes.number,
  type: propTypes.oneOf(['sector', 'circle']),
  withAnimation: propTypes.bool
}

const isEqual = (prevProps, nextProps) => {
  return isequal(prevProps, nextProps)
}

export default React.memo(Percentage, isEqual)
