import React, { PureComponent } from 'react'
import propTypes from 'prop-types'
import { injectIntl, FormattedMessage } from 'react-intl'

export * from 'react-intl'
export * from './utils'

// eslint-disable-next-line import/no-mutable-exports
export let intl = null

export const Trans = function (props) {
  return <FormattedMessage {...props} />
}

Trans.propTypes = {
  id: propTypes.string.isRequired,
  defaultMessage: propTypes.string.isRequired,
  description: propTypes.string,
  values: propTypes.object,
  tagName: propTypes.string
}

class IntlGlobalProvider extends PureComponent {
  constructor(props) {
    super(props)
    intl = this.props.intl
    const f = intl.formatMessage
    intl.t = function ({ id, defaultMessage, description }, values = {}) {
      return f({ id, defaultMessage, description }, { ...values })
    }
  }

  render() {
    return this.props.children
  }
}

export default injectIntl(IntlGlobalProvider)
