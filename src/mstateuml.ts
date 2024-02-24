namespace mstate {

    /**
     * (internal) UML, convert id (number) to state/trigger name (string)
     * @param nameId state id or trigger id
     * @returns state name (string) or trigger name (string): "[id]" if undefined
     */
    //% shim=mstate::dummy_simuConvName
    export function _simuConvName(nameId: number): string {
        // for the simulator
        const storeNameId = mmachine.namestore.storeNameId
        let name = Object.keys(storeNameId).find((value) => nameId == storeNameId[value])
        if (undefined === name) {
            name = "[" + nameId + "]"
        }
        return name
    }

    /**
     * (internal) UML, description stack
     * for the simulator
     */
    const _lastDescriptionList: string[] = []

    /**
     * (internal) UML, description
     * @param aDescription description
     */
    //% shim=mstate::dummy_descriptionUml
    export function _simuDescriptionUml(aDescription: string) {
        // for the simulator
        _lastDescriptionList.push(aDescription)
    }

    /**
     * (internal) UML, descriptions
     * @param aDescriptionList array of description
     */
    //% shim=mstate::dummy_descriptionsUml
    export function _simuDescriptionsUml(aDescriptionList: string[]) {
        // for the simulator
        for (const s of aDescriptionList) {
            descriptionUml(s)
        }
    }

    /**
     * (internal) UML, last description list
     * @param n (-1):all, (0): empty [], (>0): n from last
     * @returns list of description
     */
    //% shim=mstate::dummy_simuLastDescriptionListUML
    export function _simuLastDescriptionListUML(n: number): string[] {
        // for the simulator
        const ret: string[] = []
        const stack: string[] = []
        if (0 > n) {
            n = _lastDescriptionList.length
        }
        while ((0 < _lastDescriptionList.length) && (n > stack.length)) {
            stack.push(_lastDescriptionList.pop())
        }
        while (0 < stack.length) {
            ret.push(stack.pop())
        }
        return ret
    }

    /**
     * (internal) UML, state
     * @param machineId  machine id
     * @param stateId state name
     */
    //% shim=mstate::dummy_simuStateUml
    export function _simuStateUml(machineId: number, stateId: number) {
        // for the simulator
        const state: any = mmachine.getState(machineId, stateId)
        const descList = _simuLastDescriptionListUML(-1)
        if (0 < descList.length) {
            state["stateDesc"] = (
                (state["stateDesc"] ? state["stateDesc"] : []) as string[]
            ).concat(descList)
        }
    }

    /**
     * (internal) UML, transition
     * @param machineId machine id
     * @param stateId state id
     */
    //% shim=mstate::dummy_simuTransitionUml
    export function _simuTransitionUml(machineId: number, stateId: number) {
        // for the simulator
        const state = mmachine.getState(machineId, stateId)
        const stateTransition = state.stateTransitionList[(state.stateTransitionList.length - 1)]
        const stateTransitionObj: any = stateTransition
        stateTransitionObj["targetDescList"] = _simuLastDescriptionListUML(stateTransition.targetIdList.length)
    }

    export type OutputDocCallback = (value: any) => void

    let _doc: OutputDocCallback

    export function initOutputDoc(cb: OutputDocCallback) {
        if (cb) {
            _doc = cb
        } else {
            _doc = (value: any) => { }
        }
    }

    /**
     * (internal) UML, export
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     * @param aModeFlag 00b:json, 01b:state-diagram, 10b:trigger table, 11b:(both)
     */
    //% shim=mstate::dummy_exportUml
    export function _simuExportUml(aStateMachine: StateMachines, aStateName: string, aModeFlag: number) {
        // for the simulator
        const outputJson = 0 == (aModeFlag & 3)
        const outputTriggerTable = 0 != (aModeFlag & 2)
        const outputStateDiagram = 0 != (aModeFlag & 1)

        type MbState = { state: { name: string, desc: string }, isFinalState?: boolean, isChoice?: boolean }
        type MbTrigger = { trigger: { name: string, desc: string }, isCompletion?: boolean }
        type MbTransition = { transition: { source: MbState, target: MbState, trigger: MbTrigger, guard: string, effect: string }, isDesc: boolean }
        type MbStateMachine = { states: MbState[], triggers: MbTrigger[], transitions: MbTransition[] }
        const compareNameMbState = (a1: MbState, a2: MbState) => {
            let ret: number = 0
            if (a1.isFinalState) {
                ret = 1
            } else if (a2.isFinalState) {
                ret = -1
            } else {
                const name1 = a1.state.name.toUpperCase()
                const name2 = a2.state.name.toUpperCase()
                if (name1 > name2) {
                    ret = 1
                } else if (name1 < name2) {
                    ret = -1
                }
            }
            return ret
        }
        const compareNameMbTrigger = (a1: MbTrigger, a2: MbTrigger) => {
            let ret: number = 0
            if (a1.isCompletion) {
                ret = -1
            } else if (a2.isCompletion) {
                ret = 1
            } else {
                const name1 = a1.trigger.name.toUpperCase()
                const name2 = a2.trigger.name.toUpperCase()
                if (name1 > name2) {
                    ret = 1
                } else if (name1 < name2) {
                    ret = -1
                }
            }
            return ret
        }

        // statemachine json
        const mb: MbStateMachine = { states: [], triggers: [], transitions: [] }

        // state - initial/final
        mb.states.push({ state: { name: "", desc: "(initial/final)" }, isFinalState: true })
        // trigger - completion transition
        mb.triggers.push({ trigger: { name: "", desc: "(completion transition)" }, isCompletion: true })
        // build states and triggers
        for (const state of mmachine.getStateMachine(aStateMachine)._stateList) {
            const stateObj = state as any

            // state
            const stateName = mstate._simuConvName(state.stateId)
            let objState = mb.states.find((value) => { return stateName == value.state.name })
            if (!objState) {
                const stateDesc = ((stateObj["stateDesc"] ? stateObj["stateDesc"] : []) as string[]).join("\\n")
                objState = { state: { name: stateName, desc: stateDesc } }
                if (("" == stateDesc)
                    && (0 == state.entryActionList.length)
                    && (0 == state.doActivityList.length)
                    && (0 == state.exitActionList.length)
                    && (0 < state.stateTransitionList.length)
                ) {
                    const t = state.stateTransitionList.find((item) => {
                        if (mmachine.namestore.NONE_ID != item.triggerId) {
                            return true
                        }
                        const selfTarget = item.targetIdList.find((value) => state.stateId == value)
                        if (selfTarget) {
                            return true
                        }
                        return false
                    })
                    if (!t) {
                        let targetCount = 0
                        for (const stateTransition of state.stateTransitionList) {
                            targetCount += stateTransition.targetIdList.length
                        }
                        if (1 < targetCount) {
                            // <<choice>>
                            objState.isChoice = true
                        }
                    }
                }
                mb.states.push(objState)
            }

            // state transition
            for (const stateTransition of state.stateTransitionList) {
                if (mmachine.namestore.SYS_START_TRIGGER_ID == stateTransition.triggerId) {
                    // for StarterTransition
                    continue
                }
                // trigger
                const triggerName = mstate._simuConvName(stateTransition.triggerId)
                let objTrigger = mb.triggers.find((value) => { return triggerName == value.trigger.name })
                if (!objTrigger) {
                    objTrigger = { trigger: { name: triggerName, desc: "" } }
                    mb.triggers.push(objTrigger)
                }
            }
        }
        // build transitions
        for (const state of mmachine.getStateMachine(aStateMachine)._stateList) {

            // state
            const stateName = mstate._simuConvName(state.stateId)
            const source = mb.states.find((value) => { return stateName == value.state.name })

            // stateTransition
            for (const stateTransition of state.stateTransitionList) {
                const stateTransitionObj = stateTransition as any

                // trigger
                const triggerName = mstate._simuConvName(stateTransition.triggerId)
                const trigger = mb.triggers.find((value) => { return triggerName == value.trigger.name })

                // state transition
                const targetDescList: string[] = stateTransitionObj["targetDescList"] ? stateTransitionObj["targetDescList"] : []
                stateTransition.targetIdList.forEach((targetId, index) => {
                    // transition
                    const targetName = mstate._simuConvName(targetId)
                    let target = mb.states.find((value) => { return targetName == value.state.name })
                    if (!target) {
                        target = { state: { name: targetName, desc: "" } }
                        mb.states.push(target)
                    }
                    let guard = ""
                    let effect = ""
                    let isDesc = false
                    let s = targetDescList[index]
                    if (s) {
                        if (":" == s.charAt(0)) {
                            isDesc = true
                            s = s.slice(1)
                        }
                        const a = s.split("/", 2)
                        if (a[0]) {
                            guard = a[0].trim()
                        }
                        if (a[1]) {
                            effect = a[1].trim()
                        }
                    }
                    mb.transitions.push({ transition: { source, target, trigger, guard, effect }, isDesc })
                })
            }
        }
        // validate <<choise>>
        for (const stateItem of mb.states) {
            if (stateItem.isChoice) {
                const t = mb.transitions.find(item => stateItem == item.transition.target)
                if (!t) {
                    // no targets
                    stateItem.isChoice = false
                }
            }
        }
        // sort
        mb.states.sort(compareNameMbState)
        mb.triggers.sort(compareNameMbTrigger)

        if (outputJson) {
            // startjson/endjson
            _doc("''''''''''''''''''''''''''")
            _doc("@startjson")
            _doc("' ")
            _doc("' PlantUML Web server:")
            _doc("' https://www.plantuml.com/plantuml/")
            _doc("' ")
            _doc("' Display JSON Data - https://plantuml.com/json")
            _doc("' >>>>> JSON")

            // JSON
            const stringifyJSON = (value: any, maxStringLength = 240): string[] => {
                const result: string[] = []
                const a = JSON.stringify(value, null, 1).split("\n")
                a[a.length - 1] = " " + a[a.length - 1]
                let buff: string = ""
                a.forEach((value) => {
                    if (maxStringLength < buff.length + value.length) {
                        result.push(buff)
                        buff = ""
                    }
                    buff = buff + value
                })
                if (0 < buff.length) {
                    result.push(buff)
                }
                return result
            }
            stringifyJSON(mb).forEach((s) => _doc(s))

            _doc("' <<<<< JSON")
            _doc("' ")
            _doc("' generator: https://github.com/jp-rad/pxt-mstate")
            _doc("' ")
            _doc("' PlantUML Web server:")
            _doc("' https://www.plantuml.com/plantuml/")
            _doc("' ")
            _doc("@endjson")
        }

        if (outputStateDiagram || outputTriggerTable) {
            // startuml/enduml
            _doc("''''''''''''''''''''''''''")
            _doc("@startuml")
            _doc("' ")
            _doc("' PlantUML Web server:")
            _doc("' https://www.plantuml.com/plantuml/")
            _doc("' ")
            _doc("' State Diagram - https://plantuml.com/state-diagram")
        }
        if (outputStateDiagram) {
            // statemachine
            _doc("state __M" + aStateMachine + "__ {")

            // states <<choise>>
            for (const stateItem of mb.states) {
                if (stateItem.isChoice) {
                    _doc("state " + stateItem.state.name + " <<choice>>")
                }
            }

            // start
            _doc("[*] -> " + aStateName + " : <<start>>")

            // states
            for (const stateItem of mb.states) {
                if (stateItem.isFinalState) {
                    continue
                }
                // state
                const state = stateItem.state
                if (!stateItem.isChoice) {
                    _doc("state " + state.name + (state.desc ? " : " + state.desc : ""))
                }

                // transitions
                const transList = mb.transitions.filter(value => (state.name == value.transition.source.state.name))
                for (const transItem of transList) {
                    // transition
                    const transition = transItem.transition
                    const targetName = transition.target.state.name ? transition.target.state.name : "[*]"
                    let attrPart = ((transition.guard ? " [ " + transition.guard + " ] " : "")
                        + (transition.effect ? " / " + transition.effect : "")).trim()
                    attrPart = (transition.trigger.trigger.name + " " + attrPart).trim()
                    if (attrPart) {
                        attrPart = " : " + attrPart
                    }
                    if ((transItem.isDesc) && (!stateItem.isChoice)) {
                        _doc("state " + transition.source.state.name + " : --> " + targetName + attrPart)
                    } else {
                        const arrowMarkup = transition.target.state.name ? " --> " : "  -> "
                        _doc(transition.source.state.name + arrowMarkup + targetName + attrPart)
                    }
                }
            }

            _doc("}") // statemachine

            _doc("' ")
            _doc("' generator: https://github.com/jp-rad/pxt-mstate")
            _doc("' ")
            _doc("' PlantUML Web server:")
            _doc("' https://www.plantuml.com/plantuml/")
            _doc("' ")

        }

        if (outputTriggerTable) {
            // trigger table
            _doc("json M" + aStateMachine + " {")
            // build json table rows
            type TbRow = { key: string, value: any[] }
            const headerKeyTrigger = "**trigger**"
            const headerKeySource = "**source**"
            const headerValue = [{ "": ["**[guard] / effect**", "**target**"] }]
            const tbl: TbRow[] = []
            {
                function tbAddRow(key: string) {
                    const sources: any = {}
                    sources[headerKeySource] = headerValue  // header
                    for (const state of mb.states) {
                        if (state.isFinalState) {
                            continue
                        }
                        const sourceName = (state.isChoice ? "<<choice>>\\n" : "") + state.state.name
                        sources[sourceName] = []
                    }
                    tbl.push({ key, value: [sources] })
                }
                const completionTriggerName = "(__completion__)"
                for (const triggerItem of mb.triggers) {
                    // trigger
                    const triggerName = triggerItem.isCompletion ? completionTriggerName : triggerItem.trigger.name
                    tbAddRow(triggerName)
                }
                // transitions
                for (const transItem of mb.transitions) {
                    // transition
                    const transition = transItem.transition
                    const triggerName = transition.trigger.isCompletion ? completionTriggerName : transition.trigger.trigger.name
                    const tbRow = tbl.find(value => triggerName == value.key)
                    const sourceName = (transition.source.isChoice ? "<<choice>>\\n" : "") + transition.source.state.name
                    const stateChildren: any[] = tbRow.value[0][sourceName]
                    const attrPart = ((transition.guard ? " [ " + transition.guard + " ] " : "")
                        + (transition.effect ? " / " + transition.effect : "")).trim()
                    const targetName = (transition.target.isChoice ? "<<choice>>\\n" : "") + transition.target.state.name || "[__FinalState__]"
                    const child = { "": [attrPart, targetName] }
                    stateChildren.push(child)
                }
            }
            // output header
            _doc('"' + headerKeyTrigger + '" : ["**transitions**"] ,')
            // output rows
            for (const tbRow of tbl) {
                _doc('"' + tbRow.key + '" : ' + JSON.stringify(tbRow.value) + " ,")
            }
            // output defalut row
            _doc('"**__default__**" : ["' + aStateName + '"]')
            _doc("}") // trigger table

            _doc("' ")
            _doc("' generator: https://github.com/jp-rad/pxt-mstate")
            _doc("' ")
            _doc("' PlantUML Web server:")
            _doc("' https://www.plantuml.com/plantuml/")
            _doc("' ")

        }
        if (outputStateDiagram || outputTriggerTable) {
            // startuml/enduml
            _doc("@enduml")
        }
    }

}
