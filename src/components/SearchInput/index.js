import React, { useRef, useState } from 'react'
import propTypes from 'prop-types'
import classNames from 'classnames'
import debounce from 'lodash/debounce'
import Icon from '../Icon'
import './index.less'

const SearchInput = ({
  placeholder,
  className,
  size,
  darked,
  clearable,
  loading,
  onChange,
  onSearch,
  onClear,
  debounceTime,
  autoFocus
}) => {
  const [value, setValue] = useState('')

  const debounceOnChange = useRef(debounce(onChange, debounceTime))

  const handleChange = e => {
    setValue(e.target.value)
    debounceOnChange.current(e.target.value)
  }

  const handleKeyUp = e => {
    if (e.which === 13) {
      onSearch(value)
    }
  }

  const handleClear = () => {
    setValue('')
    onChange('')
    onClear()
  }

  return (
    <div className={classNames('search-input-wrap', className, size, { loading })}>
      {loading ? (
        <Icon name="spinner" className="search-input-loading" />
      ) : (
        <Icon name="find" className="search-input-icon" onClick={() => onSearch(value)} />
      )}
      <input
        type="text"
        value={value}
        className={classNames('search-input', { darked })}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyUp={handleKeyUp}
        autoFocus={autoFocus ? 'autofocus' : null}
      />
      {clearable && value.length > 0 && (
        <Icon name="close-b" className="search-input-clear" onClick={handleClear} />
      )}
    </div>
  )
}

SearchInput.defaultProps = {
  placeholder: '',
  className: '',
  size: 'normal',
  loading: false,
  darked: false,
  onChange: () => {},
  onSearch: () => {},
  onClear: () => {},
  clearable: true,
  debounceTime: 500,
  autoFocus: false
}

SearchInput.propTypes = {
  placeholder: propTypes.string,
  className: propTypes.string,
  size: propTypes.string,
  loading: propTypes.bool,
  darked: propTypes.bool,
  onChange: propTypes.func,
  onSearch: propTypes.func,
  onClear: propTypes.func,
  clearable: propTypes.bool,
  debounceTime: propTypes.number,
  autoFocus: propTypes.bool
}

export default React.memo(SearchInput)
