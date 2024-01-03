enum StateMachines {
    M0 = 0,
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

    /**
     * convert state/trigger name (string) to id (number): new id if undefined
     * @param name state name (string) or trigger name (string)
     * @returns state id or trigger id
     */
    //% block="id of $name"
    //% name.defl="a"
    //% weight=210
    //% advanced=true
    export function convId(name: string): number {
        return mname.getIdOrNew(name.split(":", 1)[0])
    }

    /**
     * Internal event settings
     * @param aStateMachine StateMachines
     * @param eventId Event ID (default: 32868 = 32768 + 100)
     * @param ms Event loop interval (default: 100ms)
     */
    //% block="settings [$aStateMachine] event ID: $eventId every: $ms ms"
    //% aStateMachine.defl=StateMachines.M0
    //% eventId.defl=32768
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settingsMachineEvent(aStateMachine: StateMachines, eventId: number, ms: number) {
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
     * @param body code to run, (machine: machine ID, state: state ID)
     */
    //% block="define [$machine,$state] to $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% draggableParameters="reporter"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string,
        body: (machine: number, state: number) => void
    ) {
        body(aStateMachine, convId(aStateName))
        // uml
        _simuStateUml(aStateMachine, aStateName)
    }

    /**
     * declare ENTRY action.
     * @param aMachine machine ID
     * @param aState state ID
     * @param body code to run
     */
    //% block="on entry [$aMachine,$aState]"
    //% aMachine.defl=0
    //% aState.defl=0
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(aMachine: number, aState: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).entryActions.push(new mmachine.EntryExitAction(body))
    }

    /**
     * declare DO activity.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aEvery interval time (milliseconds)
     * @param body code to run
     */
    //% block="on do [$aMachine,$aState] every $aEvery ms"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aEvery.shadow="timePicker"
    //% handlerStatement
    //% weight=160
    //% group="Declare"
    export function declareDo(aMachine: number, aState: number, aEvery: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).doActivities.push(new mmachine.DoActivity(aEvery, body))
    }

    /**
     * declare EXIT action.
     * @param aMachine machine ID
     * @param aState state ID
     * @param body code to run
     */
    //% block="on exit [$aMachine,$aState]"
    //% aMachine.defl=0
    //% aState.defl=0
    //% handlerStatement
    //% weight=150
    //% group="Declare"
    export function declareExit(aMachine: number, aState: number,
        body: () => void
    ) {
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).exitActions.push(new mmachine.EntryExitAction(body))
    }

    /**
     * declare simple transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTriggerName trigger name
     * @param aToName next state nam
     */
    //% block="trasition [$aMachine,$aState] when $aTriggerName to $aToName"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aTriggerName.defl="e"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=140
    //% group="Transition"
    export function declareSimpleTransition(aMachine: number, aState: number, aTriggerName: string, aToName: string) {
        declareCustomTransition(aMachine, aState, aTriggerName, [aToName], function () {
            mstate.transitTo(aMachine, 0)
        })
    }

    /**
     * declare timeouted transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aMs timeout (ms)
     * @param aToName next state name
     */
    //% block="trasition [$aMachine,$aState] timeouted $aMs to $aToName"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aMs.shadow="timePicker"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=130
    //% group="Transition"
    export function declareTimeoutedTransition(aMachine: number, aState: number, aMs: number, aToName: string) {
        declareCustomTransition(aMachine, aState, "", [aToName], function () {
            if (mstate.isTimeouted(aMachine, aMs)) {
                mstate.transitTo(aMachine, 0)
            }
        })
    }

    /**
     * declare custom transition.
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTriggerName trigger name
     * @param aTransList array of next state name 
     * @param body code to run
     */
    //% block="trasition [$aMachine,$aState] when $aTriggerName $args to $aTransList"
    //% aMachine.defl=0
    //% aState.defl=0
    //% aTriggerName.defl="e"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=120
    //% group="Transition"
    export function declareCustomTransition(aMachine: number, aState: number, aTriggerName: string, aTransList: string[],
        body: () => void
    ) {
        const trigger = convId(aTriggerName)
        const toList: number[] = []
        for (const s of aTransList) {
            toList.push(convId(s))
        }
        mmachine.getStateMachine(aMachine).getStateOrNew(aState).transitions.push(new mmachine.Transition(toList, trigger, body))
        // uml
        _simuTransitionUml(aMachine, aState, aTransList)
    }

    /**
     * is timeouted.
     * @param aMachine machine ID
     * @param aMs timeout (milliseconds)
     */
    //% block="timeouted [$aMachine] $aMs"
    //% aMachine.defl=0
    //% aMs.shadow="timePicker"
    //% weight=110
    //% group="Transition"
    export function isTimeouted(aMachine: number, aMs: number): boolean {
        return control.millis() > mmachine.getStateMachine(aMachine).timeoutMillis + aMs
    }

    /**
     * trigger args.
     * @param aMachine machine ID
     * @returns trigger args
     */
    //% block="trigger args [$aMachine]"
    //% aMachine.defl=0
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aMachine: number): number[] {
        return mmachine.getStateMachine(aMachine).triggerArgs
    }

    /**
     * transit to.
     * @param aMachine machine ID
     * @param index states index]
     */
    //% block="transit [$aMachine] at $index"
    //% aMachine.defl=0
    //% index.defl=0
    //% weight=100
    //% group="Transition"
    export function transitTo(aMachine: number, index: number) {
        mmachine.getStateMachine(aMachine).selectedToAt = index
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
    export function sendWith(aStateMachine: StateMachines, aTriggerName: string, aTriggerArgs: number[]) {
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
    export function start(aStateMachine: StateMachines, aStateName: string) {
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
    //% shim=mstate::simu_export_uml
    //% advanced=true
    export function exportUml(aStateMachine: StateMachines, aStateName: string) {
        // for the simulator
        const cb = console.log
        cb("@startuml")
        //cb("' PlantUML Web server:")
        cb("' http://www.plantuml.com/plantuml/")
        // top state - machine name
        cb("state __M" + aStateMachine + "__ {")

        // start
        cb("[*] --> " + aStateName)

        // target machine
        const target = mmachine.getStateMachine(aStateMachine)
        for (const state of target._states) {
            // state
            const descStatePart = (state as any)["descState"] ? " : " + (state as any)["descState"] : ""
            cb("state " + mstate._simuConvName(state.state) + descStatePart)
            for (const trans of state.transitions) {
                // transition
                const trigger = mstate._simuConvName(trans.trigger)
                for (const descTo of ((trans as any)["descToList"] as string[])) {
                    let arrow = true
                    let toName: string
                    let desc: string
                    const pos = descTo.indexOf(":")
                    if (0 <= pos) {
                        toName = descTo.slice(0, pos)
                        desc = descTo.slice(pos + 1)
                    } else {
                        toName = descTo
                        desc = undefined
                    }
                    if (toName == "") {
                        toName = "[*]"
                    }
                    let triggerPart = ""
                    if (trigger) {
                        triggerPart = triggerPart + trigger
                    }
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
                }
            }
        }

        cb("}") // top state - machine name
        cb("@enduml")
    }

    /**
     * UML state
     * @param aMachine  machine ID
     * @param aStateName state name
     */
    //% block
    //% shim=mstate::simu_state_uml
    //% blockHidden=true
    //% advanced=true
    export function _simuStateUml(aMachine: number, aStateName: string) {
        // for the simulator
        const pos = aStateName.indexOf(":")
        if (0 <= pos) {
            const name = aStateName.slice(0, pos)
            const state: any = mmachine.getStateMachine(aMachine).getStateOrNew(convId(name))
            state["descState"] = aStateName.slice(pos + 1)
        }
    }

    /**
     * UML transition
     * @param aMachine machine ID
     * @param aState state ID
     * @param aTransList array of next state name
     */
    //% block
    //% shim=mstate::simu_transition_uml
    //% blockHidden=true
    //% advanced=true
    export function _simuTransitionUml(aMachine: number, aState: number, aTransList: string[]) {
        // for the simulator
        const state = mmachine.getStateMachine(aMachine).getStateOrNew(aState)
        const lastTrans: any = state.transitions[(state.transitions.length - 1)]
        lastTrans["descToList"] = aTransList
    }

    /**
     * convert id (number) to state/trigger name (string)
     * @param id state id or trigger id
     * @returns state name (string) or trigger name (string): "[<id>]" if undefined
     */
    //% block
    //% shim=mstate::simu_conv_name
    //% blockHidden=true
    //% advanced=true
    export function _simuConvName(id: number): string {
        if (0 <= id && mname.nameList.length > id) {
            return mname.nameList[id]
        }
        return "[" + id + "]"
    }

}
