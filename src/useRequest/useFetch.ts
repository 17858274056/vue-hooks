/**
 * 1. 轮询     pollingInterval   
 *  pollingErrorRetryCount 轮询重试次数
 * 2.取消响应  cancel
 * 3.立即变更数据 修改data返回值  mutate
 * 4.手动触发  manual
 * 
 * 6.生命周期:
 *  onBefore：请求之前触发
    onSuccess：请求成功触发
    onError：请求失败触发
    onFinally：请求完成触发
 *
    7.refresh、refreshAsync 使用上一次的参数发起请求
    8.loadingDelay  延长 loading 变成true的时间
    9.ready 为false时永远不会发送请求
    10.refreshDeps 依赖刷新 值变化后会重新触发请求
    11.屏幕聚焦重新请求 refreshOnWindowFocus
    12 防抖 debounceWait
    13 节流 throttleWait
    14 缓存 & SWR 先缓存之前的请求，下次请求时先使用缓存并同步请求 返回后替换
    15 retryCount 错误重试
 */
import type { Service, option, noop, useFecthResult } from './type'
// ts-ignore
import { isRef, watch, ref, unref } from 'vue'
import { isDocumentVisible, limit, subscribe } from './utils'
import { debounce, throttle } from 'lodash-es'
import { setCache, getCache } from './utils'

export default function useFecth<R extends object, P extends any[]>(service: Service<R, P>, option: option<R, P>) {


    let data = ref() // data
    let error = ref() // errr
    let loading = ref(false)  // loading
    let watchRefreshDeps
    let _options = Object.assign({}, option)
    let { initialData } = _options
    let pollingTimer: ReturnType<typeof setTimeout>
    let loadingDelayTimer: ReturnType<typeof setTimeout>
    let pollingWhenVisibleFlag = false
    /** 是否已经被unmount了 */
    let unmountedFlag = false
    let baseCount = 0
    let currentCount = 0
    let retryCountNum = 0 // 重试当前的次数
    let unsubscribe: noop[] = [];
    let FetchKey = "DEFAULT_KEY"

    const state = {
        data: data,
        error: error,
        params: undefined,
        loading: loading,
        refresh,
        cancel,
        mutate,
        unmount,
        run,
        ...initialData

    } as useFecthResult<R, P>
    let startpollingCount = 0; //初始的轮询次数
    let pollingErrorRetryCount = _options.pollingErrorRetryCount // 轮询次数
    let debounceRun = _options.debounceInterval ? debounce(_run, _options.debounceInterval) : undefined

    let throttleRun = _options.throttleInterval ? throttle(_run, _options.throttleInterval) : undefined
    let refreshOnWindowFocusRun = _options.refreshOnWindowFocus ? limit(refresh, _options.focusTimespan) : undefined

    refreshOnWindowFocusRun && unsubscribe.push(subscribe(refreshOnWindowFocusRun))
    _options.pollingWhenHidden && unsubscribe.push(subscribe(repolling))


    if (_options.refreshDeps && _options.refreshDeps.length > 0) {
        let status = _options.refreshDeps.some(ref => isRef)
        if (!status) {

            throw Error("refreshDeps value is must ref")
        }
        watchRefreshDeps = watch(_options.refreshDeps, () => {
            refresh()
        })
    }

    function repolling() {
        if (pollingWhenVisibleFlag) {
            pollingWhenVisibleFlag = false
            refresh()
        }
    }

    function refresh() {
        return run(...state.params)
    }

    function mutate(data: any) {
        if (data === typeof 'function') {
            state.data.value = data(state.data)
        } else {
            state.data = data
        }
    }

    function cancel() {
        if (debounceRun) {
            debounceRun.cancel()
        }
        if (throttleRun) {
            throttleRun.cancel()
        }
        if (loadingDelayTimer) {
            clearTimeout(loadingDelayTimer)
        }
        if (pollingTimer) {
            clearTimeout(pollingTimer)
        }
        baseCount += 1
        state.loading.value = false
        pollingWhenVisibleFlag = false
        watchRefreshDeps && watchRefreshDeps() // 清除watch
    }
    function run(...args: P) {
        if (debounceRun) {
            return debounceRun(...args);
        }
        if (throttleRun) {
            return throttleRun(...args)
        }

        if (_options.cacheKey) {
            FetchKey = _options.cacheKey
            let cache = getCache(FetchKey)
            let oldData = cache.data
            if (oldData && cache.startTime + cache.timer > new Date().getTime()) {
                state.data.value = oldData.data;
                state.error.value = oldData.error
                state.params = oldData.params
                state.loading.value = oldData.loading
                if (_options.staleTime === -1 || new Date().getTime() - cache.startTime <= _options.staleTime) {
                    return state
                }
            }
        }

        if (_options.onBefore) {
            let pas = _options.onBefore(args)
            if (pas) state.params = pas
        }

        return _run(...args)
    }

    function _run(...args: P) {
        if (pollingTimer) { // 清除轮询定时器
            clearTimeout(pollingTimer)
        }
        if (loadingDelayTimer) { // 清除loading延时器
            clearTimeout(loadingDelayTimer)
        }
        baseCount += 1;
        // const currentCount = baseCount
        currentCount += 1
        loading.value = !_options.loadingDelay
        state.params = args
        if (_options.loadingDelay) {
            loadingDelayTimer = setTimeout(() => {
                state.loading.value = true
            }, _options.loadingDelay)
        }

        return service(...args)
            .then((res) => {

                if (!unmountedFlag && currentCount === baseCount) {
                    if (_options.retryCount) retryCountNum = 0
                    // const formatResult = option.formatResult ? option.formatResult(res) : res
                    state.data.value = res;
                    state.error.value = undefined
                    state.loading.value = false
                    if (_options.onSuccess) {
                        _options.onSuccess(unref(state.data), args)
                    }
                    if (_options.cacheKey) {
                        let cache = getCache(FetchKey)
                        let oldData = cache.data

                        if (!oldData || new Date().getTime() - cache.startTime >= _options.staleTime) {
                            setCache(FetchKey, _options.cacheTime ?? 30000, {
                                data: res,
                                error: undefined,
                                loading: false,
                                params: args
                            })
                        }
                        // else {
                        //     if (new Date().getTime() - cache.startTime > cache.timer) {
                        //         // if (_options.staleTime !== -1 && new Date().getTime() - cache.startTime >= _options.staleTime) {

                        //         setCache(FetchKey, _options.cacheTime ?? 30000, {
                        //             data: res,
                        //             error: undefined,
                        //             loading: false,
                        //             params: args
                        //         })
                        //     }
                        // }
                    }

                    return res
                }
            }).catch((error) => {
                if (!unmountedFlag && currentCount === baseCount) {
                    if (loadingDelayTimer) {
                        clearTimeout(loadingDelayTimer)
                    }
                    state.data = undefined
                    state.error = error
                    state.loading.value = false
                    if (_options.onError) {
                        _options.onError(unref(error), args)
                    }
                    if (_options.throwOnError) {
                        throw error;
                    }
                    console.error(error)
                    if (_options.retryCount) {
                        retryCountNum++

                        if (_options.retryCount === -1) {
                        } else if (_options.retryCount >= retryCountNum) {
                        } else {
                            return Promise.reject('useRequest has caught the exception, if you need to handle the exception yourself, you can set options.throwOnError to true.',)
                        }

                        setTimeout(() => {
                            _run(...args)
                        }, _options.retryInterval || 1000 * 2 ** retryCountNum > 300000 ? 300000 : 1000 * 2 ** retryCountNum)
                    } else {
                        return Promise.reject('useRequest has caught the exception, if you need to handle the exception yourself, you can set options.throwOnError to true.',)

                    }
                }
            })
            .finally(() => {

                if (_options.onFinally) {
                    _options.onFinally(args, state, state.error)
                }

                if (!unmountedFlag && currentCount === baseCount) {
                    if (loadingDelayTimer) {
                        clearTimeout(loadingDelayTimer)
                    }
                    if (_options.pollingInterval) {
                        if (!isDocumentVisible() && !_options.pollingWhenHidden) {
                            pollingWhenVisibleFlag = true;
                            return
                        }
                        if (pollingErrorRetryCount) {
                            if (startpollingCount < pollingErrorRetryCount) {
                                startpollingCount++
                            } else {
                                pollingWhenVisibleFlag = true;
                                startpollingCount = 0
                                return
                            }

                        }
                        pollingTimer = setTimeout(() => {
                            _run(...args)
                        }, _options.pollingInterval)
                    }

                }
            })
    }

    function unmount() {
        unmountedFlag = true;
        cancel()
        unsubscribe.length > 0 && unsubscribe.forEach(fn => fn())

    }




    return state
}