import React, { PureComponent } from 'react'
import classNames from 'classnames'
import { AutoComplete, Input } from 'antd'
import Icon from '@/components/Icon'
import Avatar from '@/components/Avatar'
import IconButton from '@/components/IconButton'
import { asyncSearchContact } from '@/services/contacts'
import imUtils from '@/utils/im'
import './MeetingSearch.less'

class MeetingSearch extends PureComponent {
  state = {
    options: [],
    loading: false
  }

  timer = null

  handleSearch = value => {
    this.props.onSearch(value)
    if (value.trim() === '') {
      this.setState({ options: [], loading: false })
      return
    }
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(async () => {
      this.setState({ loading: true })
      const { memberList = [] } = await asyncSearchContact({ memberName: value })
      const options = memberList.map(member => ({
        ...member,
        memberName: imUtils.clearHtmlAndBrackets(member.memberName)
      }))
      this.setState({ options, loading: false })
    }, 300)
  }

  handleJoin = member => {
    window.netcall.joinMeeting({
      account: member.imAccid,
      nick: member.memberName,
      avatar: member.memberIcon
    })
  }

  handleSelect = (value, option) => {
    const { options } = this.state
    const member = options.find(item => item.imAccid === option.key)
    this.props.onSelect(member)
    this.handleJoin(member)
  }

  getStatusByAccount = account => {
    const target = this.props.joinedMembers.find(member => member.account === account)
    if (target) {
      return {
        inMeeting: true,
        joined: target.joined
      }
    }
    return {
      inMeeting: false,
      joined: false
    }
  }

  renderOption(item) {
    const { inMeeting, joined } = this.getStatusByAccount(item.imAccid)
    return {
      value: item.memberName,
      key: item.imAccid,
      label: (
        <div
          key={item.imAccid}
          className={classNames('meeting-search-item', {
            joined: inMeeting
          })}
        >
          <div>
            <Avatar url={item.memberIcon || item.memberName} />
            <div
              className="meeting-search-item-nick"
              dangerouslySetInnerHTML={{ __html: item.memberName }}
            />
            <div
              className="meeting-search-item-depart"
              dangerouslySetInnerHTML={{ __html: item.departmentName }}
            />
          </div>
          {inMeeting ? (
            <span className="meeting-search-item-extra">{joined ? '已加入' : '等待接通...'}</span>
          ) : (
            <IconButton name="phone-connect-f" size="12px" className="netcall-button green" />
          )}
        </div>
      )
    }
  }

  render() {
    const { options, loading } = this.state
    const renderOptions = options.map(option => this.renderOption(option))
    return (
      <AutoComplete
        className="meeting-search"
        dropdownClassName="meeting-search-dropdown"
        defaultActiveFirstOption
        options={renderOptions}
        onSearch={this.handleSearch}
        onSelect={this.handleSelect}
        onFocus={this.props.onFocus}
        onBlur={this.props.onBlur}
      >
        <Input
          className="meeting-search-input"
          prefix={<Icon name={loading ? 'spinner' : 'find'} />}
          placeholder="搜索参会人"
          allowClear
        />
      </AutoComplete>
    )
  }
}

MeetingSearch.defaultProps = {
  joinedMembers: [],
  onFocus: () => {},
  onSelect: () => {},
  onSearch: () => {},
  onBlur: () => {}
}

export default MeetingSearch
