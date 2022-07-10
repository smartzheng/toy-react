import { commitRender, getCurrentFunctionFiber, getHookIndex } from './fiber'

export class Component {

  constructor(props) {
    this.props = props
  }
}

Component.prototype.isReactComponent = true
Component.prototype.setState = function (param) {
  if (typeof param === 'function') {
    this.state = {
      ...this.state,
      ...param(this.state, this.props)
    }
  } else if (typeof param === 'object') {
    this.state = {
      ...this.state,
      ...param
    }
  }
  commitRender()
}
Component.prototype._updateProps = function (props) {
  this.props = props
}

export function useState(initial) {
  let currentFunctionFiber = getCurrentFunctionFiber()
  const hookIndex = getHookIndex()
  // 根据 currentFunctionFiber.alternate.hooks.[hookIndex] 判断有没有已经存在的对应的旧的 hook
  const oldHook = currentFunctionFiber?.alternate?.hooks?.[hookIndex]
  const hook = { state: oldHook ? oldHook.state : initial, queue: [] }

  // 函数组件执行时调用useState实际是执行的oldHook的actions
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = (action) => {
    if (typeof action === 'function') {
      hook.queue.push(action)
    } else {
      hook.queue.push(() => action)
    }
    commitRender()
  }
  currentFunctionFiber.hooks.push(hook)
  return [hook.state, setState]

}
