import { Ref, unref } from 'vue'
import type { MaybeElementRef } from './type'
export function isDocumentVisible(): boolean {
    if (typeof document !== 'undefined' && typeof document.visibilityState !== 'undefined') {
        return document.visibilityState !== 'hidden';
    }
    return true;
}

export function isOnline(): boolean {
    if (typeof navigator.onLine !== 'undefined') {
        return navigator.onLine;
    }
    return true;
}


export function clearParams<T>(pageConfig: Ref, ignoreData: T) {
    for (let i in pageConfig.value) {
        if (ignoreData[i]) {
            continue
        }
        if (pageConfig.value.hasOwnProperty(i)) {
            if (Array.isArray(pageConfig.value[i])) {
                pageConfig.value[i] = []
            } else if (typeof pageConfig.value[i] !== 'object') {
                pageConfig.value[i] = ''
            }
        }
    }
}

export const isClient = typeof window !== 'undefined'

export let ignoreData = {
    page: true,
    pageSize: true
}


export function unrefElement(elRef: MaybeElementRef): HTMLElement | SVGElement | undefined {
    const plain = unref(elRef)
    return (plain as any)?.$el ?? plain
}


export function limit<T extends any[]>(fn: (...args: T) => any, timespan = 1000) {
    let pending = false;
    return (...args: T) => { // 闭包 延迟执行
        if (pending) return;
        pending = true;
        fn.apply(null, args)
        setTimeout(() => {
            pending = false;
        }, timespan);
    };
}


const listeners: any = []

export function subscribe(listener: () => void) {
    listeners.push(listener)
    return function unSubscribe() {
        let index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
    }
}
let eventsBinded = false;
if (typeof window !== 'undefined' && window.addEventListener && !eventsBinded) {
    const revalidate = () => {
        if (!isDocumentVisible() || !isOnline()) return;
        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener();
        }
    };
    window.addEventListener('visibilitychange', revalidate, false); // 监听页面是否离开或者显示
    window.addEventListener('focus', revalidate, false); // 是否聚焦
    // only bind the events once
    eventsBinded = true; // 只执行一次 把事件绑定
}




export type CacheKeyType = string | number
export type cacheData = { data: any; timer: number | undefined; startTime: number }

const cache = new Map<CacheKeyType, cacheData>()

export const setCache = (key: CacheKeyType, cacheTime: number, data: any) => {
    cache.set(key, {
        data,
        timer: cacheTime,
        startTime: new Date().getTime()
    })
}


export const getCache = (key: CacheKeyType) => {
    const currentCache = cache.get(key)
    if (!currentCache) {
        return {
            data: undefined,
            startTime: undefined,
            timer: 0
        }
    }
    let currentTime = new Date().getTime()
    if (currentCache.timer + currentCache.startTime < currentTime) {
        currentCache.data = null
        cache.delete(key)
    }
    return {
        data: currentCache?.data,
        startTime: currentCache?.startTime,
        timer: currentCache.timer
    }
}

