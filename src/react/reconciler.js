/**
 *
 * @param workInProgress 当前工作单元的fiber
 * @param elements 需要渲染的元素
 */
import { deleteFiber } from './fiber'

export function reconcileChildren(workInProgress, elements) {
  let index = 0
  let preSibling = null
  let oldFiber = workInProgress.alternate?.child
  while (index < elements.length) {
    let newFiber = null
    const element = elements[index]
    const isSameType = element?.type && oldFiber?.element?.type && element.type === oldFiber.element?.type

    // 创建新的 fiber
    if (isSameType) {
      newFiber = {
        element: {
          ...element,
          props: element.props
        },
        return: workInProgress,
        stateNode: null,
        alternate: oldFiber,
        flag: 'Update'
      }
    } else {
      // type 不同，表示添加或者删除
      if (element || element === 0) {
        // element 存在，表示添加
        newFiber = {
          element,
          stateNode: null,
          return: workInProgress,
          alternate: null,
          flag: 'Placement',
          index,
        }
      }
      if (oldFiber) {
        // oldFiber存在，删除 oldFiber
        oldFiber.flag = 'Deletion'
        deleteFiber(oldFiber)
      }
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // 第一个元素作为上一级fiber的child, 其他作为上一个fiber的sibling
    if (index === 0) {
      workInProgress.child = newFiber
      preSibling = newFiber
    } else {
      if (preSibling)
        preSibling.sibling = newFiber
      preSibling = newFiber
    }
    index++
  }
}

