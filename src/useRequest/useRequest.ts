import { onUnmounted, nextTick } from 'vue';
import type { Service, requestOption, useFecthResult } from './type';
import useFecth from "./useFetch"

export function useRequest<R extends object, P extends any[]>(service: Service<R, P>, option?: requestOption<R, P>) {
    option = Object.assign({
        params: []
    }, option)
    let {
        manual,
        ...FetchOption
    } = option
    let result: useFecthResult<R, P>
    result = useFecth(service, FetchOption)

    nextTick(() => {
        if (!manual) {
            result.run(...FetchOption.params)
        }

    })


    onUnmounted(() => {
        result.unmount()
    })

    return result
}