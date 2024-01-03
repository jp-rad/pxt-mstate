enum StateMachines {
    M0 = 1,
    M1,
    M2,
    M3,
    M4,
    M5
}

/**
 * mstate blocks
 * Defining blocks: https://makecode.com/defining-blocks
 * Playground: https://makecode.com/playground
 * icon: a Unicode identifier for an icon from the Font Awesome icon set.
 *       http://fontawesome.io/icons
 */
//% weight=100 color="#4C97FF" icon="\uf362"
//% groups="['Command', 'Declare', 'Transit']"
namespace mstate {

    const MACHINE_ID_BITS = 4
    const MACHINE_ID_MASK = (1 << MACHINE_ID_BITS) - 1

    /**
     * split machine-state/machine-trigger ID
     * @param aMstateId machine-state/machine-trigger ID
     * @returns [machine ID, state/trigger ID (name ID)]
     */
    function splitMstateId(aMstateId: number
    ): [number, number] {
        if (0 >= aMstateId) {
            return [-1, 0]
        }
        const machineId = aMstateId & MACHINE_ID_MASK
        const nameId = aMstateId >> MACHINE_ID_BITS
        return [machineId ? machineId : -1, nameId]
    }

    /**
     * build machine-state/machine-trigger ID
     * @param aStateMachine machine ID or machine-state/machine-trigger ID
     * @param id state/trigger ID (name ID)
     * @returns machine-state/machine-trigger ID
     */
    function buildMstateId(aStateMachine: StateMachines, id: number
    ): number {
        return (id << MACHINE_ID_BITS) + (aStateMachine & MACHINE_ID_MASK)
    }

    /**
     * convert state/trigger name (string) to id (number): new id if undefined
     * @param name state name (string) or trigger name (string)
     * @returns state id or trigger id
     */
    //% block="id of $name"
    //% name.defl="a"
    //% weight=210
    //% advanced=true
    export function convId(name: string
    ): number {
        return mname.getNameIdOrNew(name)
    }

    /**
     * Internal event settings
     * @param aStateMachine StateMachines
     * @param eventId Event ID (default: 32868 = 32768 + 100)
     * @param ms Event loop interval (default: 100ms)
     */
    //% block="settings $aStateMachine event ID: $eventId every: $ms ms"
    //% aStateMachine.defl=StateMachines.M0
    //% eventId.defl=32768
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settingsMachineEvent(aStateMachine: StateMachines,
        eventId: number, ms: number
    ) {
        const machine = mmachine.getStateMachine(aStateMachine)
        if (!machine._initialized) {
            machine._updateEventId = eventId
            machine._eventLoopInterval = ms
        }
    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run, (mstateId: machine-state ID)
     */
    //% block="define $aStateMachine $mstateId to $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% draggableParameters="reporter"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string,
        body: (mstateId: number) => void
    ) {
        const mstateId = buildMstateId(aStateMachine, convId(aStateName))
        body(mstateId)
    }

    /**
     * declare ENTRY action.
     * @param aMstateId machine-state ID
     * @param body code to run
     */
    //% block="mstate $aMstateId on entry"
    //% $aMstateId.defl=0
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(aMstateId: number,
        body: () => void
    ) {
        const [machine, state] = splitMstateId(aMstateId)
        if (0 > machine) {
            return
        }
        mmachine.getStateMachine(machine).getStateOrNew(state).entryActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machine, state)
    }

    /**
     * declare DO activity.
     * @param machine-state ID
     * @param aEvery interval time (milliseconds)
     * @param body code to run
     */
    //% block="mstate $aMstateId on do every $aEvery ms"
    //% aMstateId.defl=0
    //% aEvery.shadow="timePicker"
    //% handlerStatement
    //% weight=160
    //% group="Declare"
    export function declareDo(aMstateId: number,
        aEvery: number, body: () => void
    ) {
        const [machine, state] = splitMstateId(aMstateId)
        if (0 > machine) {
            return
        }
        mmachine.getStateMachine(machine).getStateOrNew(state).doActivities.push(new mmachine.DoActivity(aEvery, body))
        // uml
        _simuStateUml(machine, state)
    }

    /**
     * declare EXIT action.
     * @param machine-state ID
     * @param body code to run
     */
    //% block="mstate $aMstateId on exit"
    //% aMstateId.defl=0
    //% handlerStatement
    //% weight=150
    //% group="Declare"
    export function declareExit(aMstateId: number,
        body: () => void
    ) {
        const [machine, state] = splitMstateId(aMstateId)
        if (0 > machine) {
            return
        }
        mmachine.getStateMachine(machine).getStateOrNew(state).exitActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machine, state)
    }

    /**
     * declare simple transition.
     * @param machine-state ID
     * @param aTriggerName trigger name
     * @param aToName next state nam
     */
    //% block="mstate $aMstateId trasition when $aTriggerName to $aToName"
    //% aMstateId.defl=0
    //% aTriggerName.defl="e"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=140
    //% group="Transition"
    export function declareSimpleTransition(aMstateId: number,
        aTriggerName: string, aToName: string
    ) {
        declareCustomTransition(aMstateId, aTriggerName, [aToName], function () {
            mstate.transitTo(aMstateId, 0)
        })
    }

    /**
     * declare timeouted transition.
     * @param aMstateId machine-state ID
     * @param aMs timeout (ms)
     * @param aToName next state name
     */
    //% block="mstate $aMstateId trasition timeouted $aMs to $aToName"
    //% aMstateId.defl=0
    //% aMs.shadow="timePicker"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=130
    //% group="Transition"
    export function declareTimeoutedTransition(aMstateId: number,
        aMs: number, aToName: string
    ) {
        declareCustomTransition(aMstateId, "", [aToName], function () {
            if (mstate.isTimeouted(aMstateId, aMs)) {
                mstate.transitTo(aMstateId, 0)
            }
        })
    }

    /**
     * declare custom transition.
     * @param machine-state ID
     * @param aTriggerName trigger name
     * @param aTransList array of next state name 
     * @param body code to run
     */
    //% block="mstate $aMstateId trasition when $aTriggerName $args to $aTransList"
    //% aMstateId.defl=0
    //% aTriggerName.defl="e"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=120
    //% group="Transition"
    export function declareCustomTransition(aMstateId: number,
        aTriggerName: string, aTransList: string[], body: () => void
    ) {
        const trigger = convId(aTriggerName)
        const toList: number[] = []
        for (const s of aTransList) {
            toList.push(convId(s))
        }
        const [machine, state] = splitMstateId(aMstateId)
        if (0 > machine) {
            return
        }
        mmachine.getStateMachine(machine).getStateOrNew(state).transitions.push(new mmachine.Transition(toList, trigger, body))
        // uml
        _simuTransitionUml(machine, state, aTransList)
    }

    /**
     * is timeouted.
     * @param machine-state ID, as machine ID
     * @param aMs timeout (milliseconds)
     */
    //% block="mstate $aMstateId timeouted $aMs"
    //% aMstateId.defl=0
    //% aMs.shadow="timePicker"
    //% weight=110
    //% group="Transition"
    export function isTimeouted(aMstateId: number,
        aMs: number
    ): boolean {
        const [machine, _] = splitMstateId(aMstateId)
        if (0 > machine) {
            return false
        }
        return control.millis() > mmachine.getStateMachine(machine).timeoutMillis + aMs
    }

    /**
     * trigger args.
     * @param machine-state ID, as machine ID
     * @returns trigger args
     */
    //% block="mstate $aMstateId trigger args"
    //% aMstateId.defl=0
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aMstateId: number
    ): number[] {
        const [machine, _] = splitMstateId(aMstateId)
        if (0 > machine) {
            return []
        }
        return mmachine.getStateMachine(machine).triggerArgs
    }

    /**
     * transit to.
     * @param machine-state ID, as machine ID
     * @param index states index]
     */
    //% block="mstate $aMstateId transit at $index"
    //% aMstateId.defl=0
    //% index.defl=0
    //% weight=100
    //% group="Transition"
    export function transitTo(aMstateId: number,
        index: number
    ) {
        const [machine, _] = splitMstateId(aMstateId)
        if (0 > machine) {
            return
        }
        mmachine.getStateMachine(machine).selectedToAt = index
    }

    /**
     * send trigger
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     */
    //% block="send $aStateMachine $aTriggerName"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=95
    //% group="Command"
    export function send(aStateMachine: StateMachines, aTriggerName: string) {
        sendWith(aStateMachine, aTriggerName, [])
    }

    /**
     * send trigger with args
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     * @param aTriggerArgs args
     */
    //% block="send $aStateMachine $aTriggerName $aTriggerArgs"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendWith(aStateMachine: StateMachines, aTriggerName: string,
        aTriggerArgs: number[]
    ) {
        mmachine.getStateMachine(aStateMachine).send(convId(aTriggerName), aTriggerArgs)
    }

    /**
     * start state machine
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     */
    //% block="start $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=80
    //% group="Command"
    export function start(aStateMachine: StateMachines, aStateName: string
    ) {
        mmachine.getStateMachine(aStateMachine).start(convId(aStateName))
    }

    /**
     * export UML, PlantUML
     * PlantUML Web server: http://www.plantuml.com/plantuml/
     * @param aStateMachine
     * @param aStateName default state
     */
    //% block="UML $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=70
    //% group="Command"
    //% shim=mstate::dummy_number_string
    //% advanced=true
    export function exportUml(aStateMachine: StateMachines, aStateName: string
    ) {
        // for the simulator
        const cb = console.log
        cb("@startuml")
        cb("' ")
        cb("' PlantUML Web server:")
        cb("' https://www.plantuml.com/plantuml/")
        cb("' ")
        // top state - machine name
        cb("state __M" + aStateMachine + "__ {")

        // start
        cb("[*] --> " + aStateName)

        // target machine
        const target = mmachine.getStateMachine(aStateMachine)
        for (const state of target._states) {
            // state
            const descStatePart = (state as any)["descState"]
                ? " : " + ((state as any)["descState"] as string[]).join("\\n")
                : ""
            cb("state " + mstate._simuConvName(state.state) + descStatePart)
            for (const trans of state.transitions) {
                // transition
                const transList: string[] = (trans as any)["transList"]
                    ? (trans as any)["transList"] : []
                const descTransList: string[] = (trans as any)["descTransList"]
                    ? (trans as any)["descTransList"] : []
                const trigger = mstate._simuConvName(trans.trigger)
                transList.forEach((toName, index) => {
                    if (toName == "") {
                        toName = "[*]"
                    }
                    let triggerPart = ""
                    if (trigger) {
                        triggerPart = triggerPart + trigger
                    }
                    let arrow = true
                    let desc = descTransList[index]
                    if (desc) {
                        if (":" == desc.charAt(0)) {
                            arrow = false
                            desc = desc.slice(1)
                        }
                        const a = desc.split("/", 2)
                        if (a[0]) {
                            triggerPart = triggerPart + " [" + a[0] + "]"
                        }
                        if (a[1]) {
                            triggerPart = triggerPart + " / " + a[1]
                        }
                    }
                    if (triggerPart) {
                        triggerPart = " : " + triggerPart
                    }
                    if (arrow) {
                        cb(mstate._simuConvName(state.state) + " --> " + toName + triggerPart)
                    } else {
                        cb("state " + mstate._simuConvName(state.state) + ": --> " + toName + triggerPart)
                    }
                })  // transList.forEach
            }
        }

        cb("}") // top state - machine name
        cb("' ")
        cb("' generator: https://github.com/jp-rad/pxt-mstate")
        cb("' ")
        cb("' PlantUML Web server:")
        cb("' https://www.plantuml.com/plantuml/")
        cb("' ")
        cb("@enduml")
    }

    /**
     * description UML, PlantUML
     * PlantUML Web server: http://www.plantuml.com/plantuml/
     * @param aDescription
     */
    //% block="description $aDescription"
    //% aDescription.defl="(description)"
    //% weight=60
    //% group="Command"
    //% shim=mstate::dummy_string
    //% advanced=true
    export function descriptionUml(aDescription: string) {
        const aDescriptionList = [aDescription]
        descriptionsUml(aDescriptionList)
    }

    /**
     * UML description
     */
    let _lastDescriptionList: string[] = []

    /**
     * description UML, PlantUML
     * PlantUML Web server: http://www.plantuml.com/plantuml/
     * @param aDescription
     */
    //% block="description $aDescriptionList"
    //% weight=50
    //% group="Command"
    //% shim=mstate::dummy_strings
    //% advanced=true
    export function descriptionsUml(aDescriptionList: string[]) {
        _lastDescriptionList = aDescriptionList
    }

    /**
     * UML last description list
     * @returns list of description
     */
    //% block
    //% shim=mstate::dummy_ret_strings
    //% blockHidden=true
    //% advanced=true
    export function _simuLastDescriptionListUML(): string[] {
        const ret = _lastDescriptionList
        _lastDescriptionList = []
        return ret
    }

    /**
     * UML state
     * @param aMachine  machine ID
     * @param aStateName state name
     */
    //% block
    //% shim=mstate::dummy_number_number
    //% blockHidden=true
    //% advanced=true
    export function _simuStateUml(aMachine: number, aState: number
    ) {
        // for the simulator
        const state: any = mmachine.getStateMachine(aMachine).getStateOrNew(aState)
        const descList = _simuLastDescriptionListUML()
        if (0 < descList.length) {
            state["descState"] = (
                (state["descState"] ? state["descState"] : []) as string[]
            ).concat(descList)
        }
    }

    /**
     * UML transition
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTransList array of next state name
     */
    //% block
    //% shim=mstate::dummy_number_number_strings
    //% blockHidden=true
    //% advanced=true
    export function _simuTransitionUml(aMachine: number, aState: number, aTransList: string[]) {
        // for the simulator
        const state = mmachine.getStateMachine(aMachine).getStateOrNew(aState)
        const lastTrans: any = state.transitions[(state.transitions.length - 1)]
        lastTrans["transList"] = aTransList
        lastTrans["descTransList"] = _simuLastDescriptionListUML()
    }

    /**
     * convert id (number) to state/trigger name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string): "[<id>]" if undefined
     */
    //% block
    //% shim=mstate::dummy_number_ret_string
    //% blockHidden=true
    //% advanced=true
    export function _simuConvName(id: number
    ): string {
        if (0 <= id && mname.nameList.length > id) {
            return mname.nameList[id]
        }
        return "[" + id + "]"
    }

}
