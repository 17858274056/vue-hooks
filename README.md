# hooks 工具库

## 下载

`$ npm install  keylion-hooks`

## useRequest

`与请求库无关，支持axio、fetch等请求封装库。
用于数据获取的Vue 3组合API，支持SWR、轮询、错误重试、缓存请求
`

### 使用

```js
import {useRequest} from "keylion-hooks";

function changeUsername() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({data: 123, code: 123});
    }, 1000);
  });
}
let {data, run} = useRequest(changeUsername, {
  refreshOnWindowFocus: true,
  // focusTimespan: 8000 // 延迟 n 秒 后执行， 并不是每次聚焦都执行，而是过一段时间后可以再次执行
  // pollingInterval: 1000,
  // pollingWhenHidden: true,
});
```

### 参数说明

| 参数                     | 说明                                                                                                      | 类型         | 默认值  |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------ | ------- |
| `manual`                 | 是否手动控制发送请求                                                                                      | _boolean_    | `false` |
| `pollingInterval`        | 轮询间隔时间                                                                                              | _number_     | `-`     |
| `pollingErrorRetryCount` | 轮询次数                                                                                                  | _number_     | `-`     |
| `pollingWhenHidden`      | 不在当前屏幕则停止轮询                                                                                    | _boolean_    | `false` |
| `refreshDeps`            | 依赖刷新 值变化后重新触发请求                                                                             | _Ref<any>[]_ | `-`     |
| `refreshOnWindowFocus`   | 屏幕聚焦重新请求                                                                                          | _boolean_    | `false` |
| `focusTimespan`          | 屏幕聚焦重新请求延时（n 秒内重新聚焦请求一次）                                                            | _number_     | `1000`  |
| `debounceInterval`       | 防抖延时                                                                                                  | _number_     | `-`     |
| `throttleInterval`       | 节流延时                                                                                                  | _number_     | `-`     |
| `loadingDelay`           | 延长 loading 变成 true 的时间                                                                             | _number_     | `-`     |
| `cacheKey`               | 缓存的唯一 Key (在发送一次新的请求的时候如果有缓存，会先使用缓存的结果值，等到请求完成后替换成请求结果值) | _string_     | `-`     |
| `cacheTime`              | 缓存有效时间                                                                                              | _number_     | `-`     |
| `staleTime`              | 如何设置了 staleTime =-1 那么永久保鲜， 在 staleTime 保鲜期间内不再发起请求间                             | _number_     | `-`     |
| `params`                 | 传给接口的参数                                                                                            | _any[]_      | `-`     |
| `retryCount`             | 错误重试次数                                                                                              | _number_     | `-`     |
| `onBefore`               | 请求前触发的生命周期函数                                                                                  | _function_   | `-`     |
| `onSuccess`              | 请求成功触发的生命周期函数                                                                                | _function_   | `-`     |
| `onError`                | 请求失败触发的生命周期函数                                                                                | _funciton_   | `-`     |
| `onFinally`              | 请求完成触发的生命周期函数                                                                                | _function_   | `-`     |

### 返回值

useRequest<R extends object, P extends any[]>

| 参数      | 说明                                     | 类型             |
| --------- | ---------------------------------------- | ---------------- |
| `data`    | 返回的结果值                             | _Ref\<R\>_       |
| `error`   | 错误返回结果                             | _Ref\<Error\>_   |
| `loading` | loading 状态                             | _Ref\<boolean\>_ |
| `params`  | 当前传入参数                             | _P_              |
| `run`     | 错误返回结果                             | _(...args:P)=>R_ |
| `refresh` | 使用上一次的 params 请求参数进行重新请求 | _(...args:P)=>R_ |
| `mutate`  | 修改 data 的 值                          | _unknow_         |
| `unmount` | 结束生命周期时调用函数，清除定时器等     | _()=>void_       |
| `cancel`  | 取消函数                                 | _()=>void_       |
