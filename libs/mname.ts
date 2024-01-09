/**
 * state/trigger id:name
 */
namespace mname {
    /**
     * id:0 - INITIAL/FINAL/Completion Transition.
     */
    export const NONE_ID = 0   // id:0 - INITIAL/FINAL/Completion Transition

    /**
     * name:"" - INITIAL/FINAL/Completion Transition.
     */
    export const NONE_STR = ""

    /**
     * array of state/trigger name, index is id.
     * default: [NONE_STR,]
     */
    export let nameList: string[] = [NONE_STR,]

    /**
     * get id, new if undefined
     * @param name state name or trigger name
     * @returns state/trigger id
     */
    export function getNameIdOrNew(name: string) {
        let idx = nameList.indexOf(name)
        if (0 > idx) {
            idx = nameList.length
            nameList.push(name)
        }
        return idx
    }

}
