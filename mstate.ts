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
    function convNameId(name: string
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
    //% aStateMachine.defl=StateMachines.M1
    //% eventId.defl=32768
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settingsMachineEvent(aStateMachine: StateMachines,
        eventId: number, ms: number
    ) {
        mcontroller.settings(eventId, ms)
    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run
     */
    //% block="define $aStateMachine $mstateId to $aStateName"
    //% aStateMachine.defl=StateMachines.M1
    //% aStateName.defl="a"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string,
        body: () => void
    ) {
        mcontroller.defineState(aStateMachine,convNameId(aStateName), body)
    }

    /**
     * declare ENTRY action.
     * @param body code to run
     */
    //% block="mstate on entry"
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(
        body: () => void
    ) {
        const [machine, stateId] = mcontroller.getDefineState()
        mcontroller.getState(machine, stateId).entryActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machine, stateId)
    }

    /**
     * declare DO activity.
     * @param aEvery interval time (milliseconds)
     * @param body code to run
     */
    //% block="mstate on do every $aEvery ms"
    //% aEvery.shadow="timePicker"
    //% handlerStatement
    //% weight=160
    //% group="Declare"
    export function declareDo(
        aEvery: number, body: () => void
    ) {
        const [machineId, stateId] = mcontroller.getDefineState()
        mcontroller.getState(machineId, stateId).doActivities.push(new mmachine.DoActivity(aEvery, body))
        // uml
        _simuStateUml(machineId, stateId)
    }

    /**
     * declare EXIT action.
     * @param body code to run
     */
    //% block="mstate on exit"
    //% handlerStatement
    //% weight=150
    //% group="Declare"
    export function declareExit(
        body: () => void
    ) {
        const [machineId, stateId] = mcontroller.getDefineState()
        mcontroller.getState(machineId, stateId).exitActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machineId, stateId)
    }

    /**
     * declare simple transition.
     * @param aTriggerName trigger name
     * @param aToName next state nam
     */
    //% block="mstate trasition when $aTriggerName to $aToName"
    //% aTriggerName.defl="e"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=140
    //% group="Transition"
    export function declareSimpleTransition(
        aTriggerName: string, aToName: string
    ) {
        const [machineId, _] = mcontroller.getDefineState()
        declareCustomTransition(aTriggerName, [aToName], function () {
            mstate.transitTo(machineId, 0)
        })
    }

    /**
     * declare timeouted transition.
     * @param aMs timeout (ms)
     * @param aToName next state name
     */
    //% block="mstate trasition timeouted $aMs to $aToName"
    //% aMs.shadow="timePicker"
    //% aToName.defl="a"
    //% inlineInputMode=inline
    //% weight=130
    //% group="Transition"
    export function declareTimeoutedTransition(
        aMs: number, aToName: string
    ) {
        const [machineId, _] = mcontroller.getDefineState()
        declareCustomTransition("", [aToName], function () {
            if (mstate.isTimeouted(machineId, aMs)) {
                mstate.transitTo(machineId, 0)
            }
        })
    }

    /**
     * declare custom transition.
     * @param aTriggerName trigger name
     * @param aTransList array of next state name 
     * @param body code to run
     */
    //% block="mstate $aMstateId trasition when $aTriggerName $args to $aTransList"
    //% aTriggerName.defl="e"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=120
    //% group="Transition"
    export function declareCustomTransition(
        aTriggerName: string, aTransList: string[], body: () => void
    ) {
        const triggerId = convNameId(aTriggerName)
        const toStateIdList: number[] = []
        for (const s of aTransList) {
            toStateIdList.push(convNameId(s))
        }
        const [machineId, stateId] = mcontroller.getDefineState()
        mcontroller.getState(machineId, stateId).transitions.push(new mmachine.Transition(toStateIdList, triggerId, body))
        // uml
        _simuTransitionUml(machineId, stateId, aTransList)
    }

    /**
     * is timeouted.
     * @param aStateMachine StateMachines
     * @param aMs timeout (milliseconds)
     */
    //% block="mstate $aStateMachine timeouted $aMs"
    //% aStateMachine.defl=StateMachines.M1
    //% aMs.shadow="timePicker"
    //% weight=110
    //% group="Transition"
    export function isTimeouted(aStateMachine: StateMachines,
        aMs: number
    ): boolean {
        return control.millis() > mcontroller.getStateMachine(aStateMachine).tickOnInto + aMs
    }

    /**
     * trigger args.
     * @param aStateMachine StateMachines
     * @returns trigger args
     */
    //% block="mstate $aStateMachine trigger args"
    //% aStateMachine.defl=StateMachines.M1
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aStateMachine: StateMachines,
    ): number[] {
        return mcontroller.getStateMachine(aStateMachine).triggerArgs
    }

    /**
     * transit to.
     * @param aStateMachine StateMachines
     * @param index states index]
     */
    //% block="mstate $aStateMachine transit at $index"
    //% aStateMachine.defl=StateMachines.M1
    //% index.defl=0
    //% weight=100
    //% group="Transition"
    export function transitTo(aStateMachine: StateMachines,
        index: number
    ) {
        mcontroller.getStateMachine(aStateMachine).selectedToAt = index
    }

    /**
     * send trigger
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     */
    //% block="send $aStateMachine $aTriggerName"
    //% aStateMachine.defl=StateMachines.M1
    //% aTriggerName.defl="e"
    //% weight=95
    //% group="Command"
    export function sendTrigger(aStateMachine: StateMachines, aTriggerName: string) {
        sendTriggerArgs(aStateMachine, aTriggerName, [])
    }

    /**
     * send trigger with args
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     * @param aTriggerArgs args
     */
    //% block="send $aStateMachine $aTriggerName $aTriggerArgs"
    //% aStateMachine.defl=StateMachines.M1
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendTriggerArgs(aStateMachine: StateMachines, aTriggerName: string,
        aTriggerArgs: number[]
    ) {
        const triggerId = convNameId(aTriggerName)
        mcontroller.getStateMachine(aStateMachine).send(triggerId, aTriggerArgs)
    }

    /**
     * start state machine
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     */
    //% block="start $aStateMachine $aStateName"
    //% aStateMachine.defl=StateMachines.M1
    //% aStateName.defl="a"
    //% weight=80
    //% group="Command"
    export function start(aStateMachine: StateMachines, aStateName: string
    ) {
        mcontroller.initialize()
        const stateId = convNameId(aStateName)
        mcontroller.getStateMachine(aStateMachine).start(stateId)
    }

}
