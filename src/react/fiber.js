import { renderDom } from './react-dom'

let rootFiber
let nextUnitOfWork

/**
 * 创建fiberRoot
 * @param element
 * @param container
 */
export function createRoot(element, container) {
  rootFiber = {
    stateNode: container,
    element: {
      props: {
        children: [element]
      }
    }
  }
  // 创建rootFiber赋值给下一个执行单元, 赋值后workLoop会自动执行
  nextUnitOfWork = rootFiber
}


/**
 * 调度任务, 当浏览器有空闲时执行
 * @param deadline
 */
function workLoop(deadline) {
  let sholdYield = false
  while (nextUnitOfWork && !sholdYield) {
    // 执行单个任务
    performUnitOfWork(nextUnitOfWork)
    sholdYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

/**
 * 执行工作单元
 * @param workInProgress 当前执行单元处理的fiber节点
 */
function performUnitOfWork(workInProgress) {
  let element = workInProgress.element // 获取react element
  // 1. 根据fiber创建DOM并挂载
  if (!workInProgress.stateNode) {
    workInProgress.stateNode = renderDom(element) // 若当前 fiber 没有 stateNode, 即对应的元生DOM，则根据 fiber 挂载的 element 的属性创建
  }
  if (workInProgress.return && workInProgress.stateNode) {  // renderDom返回值也可能还是null, 所以判断workInProgress.stateNode不为空
    let parentFiber = workInProgress.return
    while (!parentFiber.stateNode) { // 条件渲染时,当条件为false,stateNode为空
      parentFiber = parentFiber.return
    }
    parentFiber.stateNode.appendChild(workInProgress.stateNode) // 挂载到父DOM节点下
  }

  // 2. 构建fiber树: 根据 React.element 去创建对应的 fiber，并通过 child、 sibling 和 return 这几个字段的形成 fiber 树
  // 当 React.element 的 type 属性是 function 时，表示 react 组件，我们将其渲染后所得到的 jsx 作为 children 处理。
  // 如果 React.element 的 type 属性是 Array，表示列表渲染，此时 array 这个节点时没有意义的，不需要形成 fiber，
  // 所以我们直接将 array 中的子节点打平放到与 array 同级的 children 数组中进行处理，生成对应 fiber
  // 当前 fiber 的 element 属性的 children 不为空时，根据 children 去迭代构建 fiber 树
  let children = element?.props?.children
  let type = element?.type
  // react组件
  if (typeof type === 'function') {
    if (type.prototype.isReactComponent) {
      const { type: Comp, props } = element
      const component = new Comp(props)
      let jsx = component.render()
      children = [jsx]
    } else {
      const { type: Fn, props } = element
      let jsx = Fn(props)
      children = [jsx]
    }
  }

  if (children) {
    let elements = Array.isArray(children) ? children : [children]
    elements = elements.flat()
    let index = 0
    let preSibling = null
    while (index < elements.length) {
      const element = elements[index]
      // 创建新的 fiber
      const newFiber = {
        element,
        return: workInProgress,
        stateNode: null
      }
      // 第一个元素作为上一级fiber的child, 其他作为上一个fiber的sibling
      if (index === 0) {
        workInProgress.child = newFiber
      } else {
        preSibling.sibling = newFiber
      }
      preSibling = newFiber
      index++
    }
  }

  // 3. 返回下一个工作单元
  if (workInProgress.child) {
    nextUnitOfWork = workInProgress.child // 如果有子 fiber，则下一个工作单元是子 fiber
  } else {
    let newFiber = workInProgress
    while (newFiber) {
      if (newFiber.sibling) {
        nextUnitOfWork = newFiber.sibling // 没有子 fiber 有兄弟 fiber，则下一个工作单元是兄弟 fiber
      } else {
        nextUnitOfWork = newFiber.return // 子 fiber 和兄弟 fiber 都没有，深度优先遍历返回上一层
      }
    }
    if (!newFiber) // 若返回最顶层，表示迭代结束，将 nextUnitOfWork 置空
      nextUnitOfWork = null
  }
}


// 启动起来
requestIdleCallback(workLoop)
