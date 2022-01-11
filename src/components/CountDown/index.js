import React, { useEffect, useState } from 'react'
import propTypes from 'prop-types'

const CountDown = ({ count, children }) => {
  const [params, setParams] = useState({ count, complete: false })

  useEffect(() => {
    if (count <= 0) {
      return setParams({
        count: 0,
        complete: true
      })
    }
    let timerId = setInterval(() => {
      setParams(value => {
        const seconds = value.count - 1
        if (seconds <= 0) {
          clearInterval(timerId)
          timerId = null
          return {
            count: seconds,
            complete: true
          }
        }
        return {
          count: seconds,
          complete: false
        }
      })
    }, 1000)

    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [count])

  return children(params)
}

CountDown.defaultProps = {
  count: 0
}

CountDown.propTypes = {
  count: propTypes.number,
  children: propTypes.func
}

export default React.memo(CountDown)
