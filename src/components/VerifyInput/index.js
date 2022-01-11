import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import propTypes from 'prop-types'
import './index.less'

const VerifyInput = ({ count, keyPattern, password, onChange, onComplete, done, onEnter }) => {
  const [values, setValues] = useState([])

  useEffect(() => {
    if (done && values) {
      setValues('')
    }
  }, [done, values])

  useEffect(() => {
    const handleKeyUp = e => {
      const pattern = typeof keyPattern === 'function' ? keyPattern(e.key) : keyPattern
      if (pattern.test(e.key)) {
        if (values.length < count) {
          setValues(value => {
            const newValues = [...value, e.key]
            Promise.resolve().then(() => onChange(newValues.join('')))
            if (newValues.length === count) {
              Promise.resolve().then(() => onComplete(newValues.join('')))
            }
            return newValues
          })
        }
      } else if (e.which === 8) {
        // BackSpace
        if (values.length > 0) {
          setValues(value => {
            const newValues = value.slice(0, value.length - 1)
            Promise.resolve().then(() => onChange(newValues.join('')))
            return newValues
          })
        }
      } else if (e.which === 13) {
        if (values.length === count) {
          onEnter(values.join(''))
        }
      }
    }
    document.addEventListener('keyup', handleKeyUp, false)
    return () => {
      document.removeEventListener('keyup', handleKeyUp, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  return (
    <div className="input-box">
      {Array.apply(null, { length: count }).map((item, i) => (
        <div
          className={classNames({
            'input-box-item': true,
            fill: password && values[i] !== undefined,
            active: values.length === i
          })}
          // eslint-disable-next-line react/no-array-index-key
          key={i}
        >
          {!password && values[i]}
        </div>
      ))}
    </div>
  )
}

VerifyInput.defaultProps = {
  count: 6,
  keyPattern: /^\d$/,
  onChange: () => {},
  onComplete: () => {},
  onEnter: () => {}
}

VerifyInput.propTypes = {
  count: propTypes.number,
  keyPattern: propTypes.oneOfType([propTypes.object, propTypes.func]),
  password: propTypes.bool,
  onChange: propTypes.func,
  onComplete: propTypes.func,
  onEnter: propTypes.func
}

export default React.memo(VerifyInput)
