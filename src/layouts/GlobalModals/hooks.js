import { useEffect, useState } from 'react'
import propTypes from 'prop-types'

export const useHook = type => {
  const [data, setData] = useState({})

  useEffect(() => {
    const handler = event => {
      setData({ confirm: true, detail: event.detail })
      setTimeout(() => {
        setData({ confirm: false })
      })
    }
    const cancelHandler = () => {
      setData({ cancel: true })
      setTimeout(() => {
        setData({ cancel: false })
      })
    }
    window.addEventListener(`${type}Confirm`, handler, false)
    window.addEventListener(`${type}Cancel`, cancelHandler, false)

    return () => {
      window.removeEventListener(`${type}Confirm`, handler, false)
      window.removeEventListener(`${type}Cancel`, cancelHandler, false)
    }
  }, [type])

  return data
}

export const useCreateGroup = () => {
  return useHook('createGroup')
}

export const useRelay = () => {
  return useHook('relay')
}

export const useTransmit = () => {
  return useHook('transmit')
}

export const GlobalModalHooks = ({ type, callback }) => {
  const state = useHook(type)
  useEffect(() => {
    if (state.confirm) {
      callback(state.detail)
    }
  }, [callback, state.confirm, state.detail])

  return null
}

GlobalModalHooks.defaultProps = {
  callback: () => {}
}

GlobalModalHooks.propTypes = {
  type: propTypes.oneOf(['createGroup', 'relay', 'transmit']).isRequired,
  callback: propTypes.func
}
