import type { Ref } from 'vue'
export type MaybeRef<T> = T | Ref<T>
export type MaybeElementRef = MaybeRef<HTMLElement | SVGElement | undefined | null>


export interface requestOption<R extends object, P extends any[]> extends option<R, P> {

    manual?: boolean

}

export interface option<T extends object, P extends any[]> {
    /**
     *  数据
     */
    data?: T,
    /** 延迟时间*/
    loadingDelay?: number,
    /** 返回结果的处理*/
    formatResult?: <F>(data: T) => F,
    /**成功回调 */
    onSuccess?: (data: T, params: P) => void;
    onBefore?: (params: P) => P | void
    /**失败回调 */
    onError?: (e: Error, params: P) => void;
    onFinally?: (params: P, result: useFecthResult<T, P>, error: Ref<Error>) => void
    throwOnError?: boolean
    /**轮询时间 */
    pollingInterval?: number
    /** 轮询次数 */
    pollingErrorRetryCount?: number
    /**不在当前屏幕则停止轮询 */
    pollingWhenHidden?: boolean
    /**防抖时间 */
    debounceInterval?: number
    /**节流时间 */
    throttleInterval?: number
    /**传入参数 */
    params?: P;
    /** 在屏幕重新获取焦点或重新显示时，重新发起请求	 */
    refreshOnWindowFocus?: boolean
    /** 重新请求间隔 */
    focusTimespan?: number
    initialData?: initialData<T, P>
    cacheKey?: string
    cacheTime?: number,
    staleTime?: number
    refreshDeps?: Ref<any>[]
    retryCount?: number // 重试次数
    retryInterval?: number // 重试时间
}

export type initialData<T extends object, P extends any[]> = Pick<useFecthResult<T, P>, "data" | "error" | "loading" | "params">

export type Mutate<R> = (x: R | undefined | ((data: R) => R)) => void;
export interface useFecthResult<R extends object, P extends any[]> {
    data: Ref<R> | undefined
    error: Ref<Error> | undefined
    loading: Ref<boolean>
    params: P | undefined
    cancel: noop
    refresh: () => Promise<R>
    mutate: Mutate<R>
    run: (...args: P) => Promise<R>
    unmount: () => void
}

export type Service<R extends object, P extends any[]> = (...args: P) => Promise<R>

export type noop = (...args: any[]) => void;
