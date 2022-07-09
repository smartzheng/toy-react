/**
 * 提交root 开始渲染DOM
 * @param workInProgressRoot
 */
import { updateAttributes } from './react-dom'
import { getDeletions } from './fiber'

export function commitRoot(workInProgressRoot) {
  const deletions = getDeletions()
  deletions.forEach(commitWork)
  commitWork(workInProgressRoot.child)
}


/**
 * 递归提交fiber渲染
 * @param fiber
 */
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  // 深度优先遍历，先遍历 child，后遍历 sibling
  commitWork(fiber.child)
  let parentDom = fiber.return.stateNode
  if (fiber.flag === 'Deletion') {
    if (typeof fiber.element?.type !== 'function') {
      parentDom.removeChild(fiber.stateNode)
    }
    return
  }

  // parentDom.appendChild(fiber.stateNode)
  if (fiber.flag === 'Placement') {
    // 添加 dom
    const targetPositionDom = parentDom.childNodes[fiber.index] // 要插入到那个 dom 之前
    if (targetPositionDom) {
      // targetPositionDom 存在，则插入
      parentDom.insertBefore(fiber.stateNode, targetPositionDom)
    } else {
      // targetPositionDom 不存在，插入到最后
      parentDom.appendChild(fiber.stateNode)
    }
  } else if (fiber.flag === 'Update') {
    const { children, ...newAttributes } = fiber.element.props
    const oldAttributes = Object.assign({}, fiber.alternate.element.props)
    delete oldAttributes.children
    updateAttributes(fiber.stateNode, newAttributes, oldAttributes)
  }
  commitWork(fiber.sibling)
}


