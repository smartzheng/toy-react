/**
 * 提交root 开始渲染DOM
 * @param rootFiber
 */
export function commitRoot(rootFiber) {
  commitWork(rootFiber.child)
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
  let parenrDom = fiber.return.stateNode
  parenrDom.appendChild(fiber.stateNode)
  commitWork(fiber.sibling)
}


