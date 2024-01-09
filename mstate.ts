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

    let _currentStateMachines: StateMachines
    let _currentStateId: number

    function getCurrentStateId() {
        return [_currentStateMachines, _currentStateId]
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
    //% aStateMachine.defl=StateMachines.M1
    //% eventId.defl=32768
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settingsMachineEvent(aStateMachine: StateMachines,
        eventId: number, ms: number
    ) {
        mcontroller.getStateMachineController(aStateMachine).settings(eventId, ms)
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
        _currentStateMachines = aStateMachine
        _currentStateId = convId(aStateName)
        body()
        _currentStateMachines = undefined
        _currentStateId = undefined
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
        const [machine, state] = getCurrentStateId()
        mcontroller.getStateMachineController(machine).stateMachine.getStateOrNew(state).entryActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machine, state)
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
        const [machine, state] = getCurrentStateId()
        mcontroller.getStateMachineController(machine).stateMachine.getStateOrNew(state).doActivities.push(new mmachine.DoActivity(aEvery, body))
        // uml
        _simuStateUml(machine, state)
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
        const [machine, state] = getCurrentStateId()
        mcontroller.getStateMachineController(machine).stateMachine.getStateOrNew(state).exitActions.push(new mmachine.EntryExitAction(body))
        // uml
        _simuStateUml(machine, state)
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
        const [machine, _] = getCurrentStateId()
        declareCustomTransition(aTriggerName, [aToName], function () {
            mstate.transitTo(machine, 0)
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
        const [machine, _] = getCurrentStateId()
        declareCustomTransition("", [aToName], function () {
            if (mstate.isTimeouted(machine, aMs)) {
                mstate.transitTo(machine, 0)
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
        const trigger = convId(aTriggerName)
        const toList: number[] = []
        for (const s of aTransList) {
            toList.push(convId(s))
        }
        const [machine, state] = getCurrentStateId()
        mcontroller.getStateMachineController(machine).stateMachine.getStateOrNew(state).transitions.push(new mmachine.Transition(toList, trigger, body))
        // uml
        _simuTransitionUml(machine, state, aTransList)
    }

    /**
     * is timeouted.
     * @param machine-state ID, as machine ID
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
        return control.millis() > mcontroller.getStateMachineController(aStateMachine).stateMachine.tickOnInto + aMs
    }

    /**
     * trigger args.
     * @param machine-state ID, as machine ID
     * @returns trigger args
     */
    //% block="mstate $aStateMachine trigger args"
    //% aStateMachine.defl=StateMachines.M1
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aStateMachine: StateMachines,
    ): number[] {
        return mcontroller.getStateMachineController(aStateMachine).stateMachine.triggerArgs
    }

    /**
     * transit to.
     * @param machine-state ID, as machine ID
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
        mcontroller.getStateMachineController(aStateMachine).stateMachine.selectedToAt = index
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
    //% aStateMachine.defl=StateMachines.M1
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendWith(aStateMachine: StateMachines, aTriggerName: string,
        aTriggerArgs: number[]
    ) {
        mcontroller.getStateMachineController(aStateMachine).send(convId(aTriggerName), aTriggerArgs)
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
        mcontroller.getStateMachineController(aStateMachine).start(convId(aStateName))
    }

}
