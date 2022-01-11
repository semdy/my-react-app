import React from 'react'
import { useNetCallReducer } from './model'
import useDurationText from './hooks/useDurationText'

const Duration = React.memo(({ className, style }) => {
  const [state] = useNetCallReducer()
  const [durationText] = useDurationText(state.channelName)

  return (
    <span className={className} style={style}>
      {durationText}
    </span>
  )
})

Duration.defaultProps = {
  className: '',
  style: {}
}

export default Duration
