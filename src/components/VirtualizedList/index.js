import React, { useRef, useImperativeHandle } from 'react'
import propTypes from 'prop-types'
import { Spin } from 'antd'
import AutoSizer from 'react-virtualized-auto-sizer'
import InfiniteLoader from 'react-window-infinite-loader'
import { FixedSizeList } from 'react-window'

const VirtualizedList = React.forwardRef(
  (
    {
      width,
      height,
      hasNextPage,
      isNextPageLoading,
      spinning,
      items,
      itemSize,
      threshold,
      loadNextPage,
      renderRow
    },
    ref
  ) => {
    const infiniteLoaderRef = useRef(null)
    const listRef = useRef(null)

    const itemCount = hasNextPage ? items.length + 1 : items.length
    const isItemLoaded = index => !hasNextPage || index < items.length
    const loadMoreItems = isNextPageLoading ? () => {} : loadNextPage
    const withInfiniteLoader = !!loadNextPage

    useImperativeHandle(ref, () => ({
      resetItemsCache: () => {
        infiniteLoaderRef.current?.resetloadMoreItemsCache()
      },
      scrollToItem: (...args) => {
        listRef.current?.scrollToItem(...args)
      }
    }))

    const renderComponent = (width, height) => {
      if (withInfiniteLoader) {
        return (
          <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            threshold={threshold}
            loadMoreItems={loadMoreItems}
          >
            {({ onItemsRendered, ref }) => (
              <Spin spinning={spinning}>
                <FixedSizeList
                  width={width}
                  height={height}
                  itemCount={itemCount}
                  itemSize={itemSize}
                  onItemsRendered={onItemsRendered}
                  ref={_ref => {
                    ref(_ref)
                    listRef.current = _ref
                  }}
                >
                  {renderRow}
                </FixedSizeList>
              </Spin>
            )}
          </InfiniteLoader>
        )
      }
      return (
        <Spin spinning={spinning}>
          <FixedSizeList
            width={width}
            height={height}
            itemCount={itemCount}
            itemSize={itemSize}
            ref={listRef}
          >
            {renderRow}
          </FixedSizeList>
        </Spin>
      )
    }

    if (height !== undefined) {
      return renderComponent(width, height)
    }

    return (
      <AutoSizer style={{ width: '100%', height: '100%' }}>
        {({ width, height }) => renderComponent(width, height)}
      </AutoSizer>
    )
  }
)

VirtualizedList.defaultProps = {
  width: '100%',
  threshold: 5,
  hasNextPage: false,
  isNextPageLoading: false,
  spinning: false
}

VirtualizedList.propTypes = {
  width: propTypes.oneOfType([propTypes.number, propTypes.string]),
  height: propTypes.oneOfType([propTypes.number, propTypes.string]),
  hasNextPage: propTypes.bool,
  isNextPageLoading: propTypes.bool,
  spinning: propTypes.bool,
  items: propTypes.array.isRequired,
  itemSize: propTypes.number.isRequired,
  threshold: propTypes.number,
  loadNextPage: propTypes.func,
  renderRow: propTypes.func.isRequired
}

export default React.memo(VirtualizedList)
