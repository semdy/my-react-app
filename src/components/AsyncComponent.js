import React, { useEffect, useState, useRef, useCallback } from 'react'
import PageLoading from '@/components/PageLoading'

export default (importComponent, beforeScript, placeholder = <PageLoading />) => {
  return props => {
    const AsyncComponent = useRef(null)
    const mounted = useRef(false)
    const [loading, setLoading] = useState(true)

    const loadComponent = useCallback(() => {
      importComponent()
        .then(component => {
          AsyncComponent.current = component.default || component
          if (mounted.current) {
            setLoading(false)
          }
        })
        .catch(e => console.error(e))
    }, [])

    useEffect(() => {
      mounted.current = true
      if (beforeScript) {
        beforeScript()
          .then(loadComponent)
          .catch(e => console.error(e))
      } else {
        loadComponent()
      }

      return () => {
        mounted.current = false
      }
    }, []) // eslint-disable-line

    // eslint-disable-next-line
    return loading ? placeholder : <AsyncComponent.current {...props} />
  }
}
