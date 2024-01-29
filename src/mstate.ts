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
//% groups="['Command', 'Declare', 'Transit', 'UML]"
namespace mstate {

    /**
     * controller - micro:bit
     */
    export namespace mcontroller {

        const DEFAULT_UPDATE_LOOP_INTERVAL = 100

        let _defineMachineId: StateMachines = undefined
        let _defineStateId: number = undefined

        /**
         * define state - machineId/stateId
         * @param machineId machine ID
         * @param stateId state ID
         * @param body code to run, body()
         */
        export function defineState(machineId: number, stateId: number, body: () => void) {
            _defineMachineId = machineId
            _defineStateId = stateId
            body()
            _defineMachineId = undefined
            _defineStateId = undefined
        }

        /**
         * get machine ID and state ID
         * @returns [machine ID, state ID]
         */
        export function getDefineState() {
            return [_defineMachineId, _defineStateId]
        }

        // state machine
        let stateMachineList: mmachine.StateMachine[] = []

        // update event/loop
        let _initialized: boolean = false
        let _updateLoopInterval: number = DEFAULT_UPDATE_LOOP_INTERVAL

        /**
         * initialize
         * - update event handler
         * - update event loop
         */
        export function initialize(): void {
            if (!_initialized) {
                _initialized = true
                // update event handler
                control.onEvent(MSTATE_BUS_ID.MSTATE_ID_UPDATE, 0, function () {
                    const machineId = control.eventValue()
                    getStateMachine(machineId).update()
                })
                // update event loop
                loops.everyInterval(_updateLoopInterval, function () {
                    for (const stateMachine of stateMachineList) {
                        _idleUpdate(stateMachine.machineId)
                    }
                })
            }
        }

        /**
         * idle update
         * @param machineId machine ID
         */
        function _idleUpdate(machineId: number) {
            control.raiseEvent(MSTATE_BUS_ID.MSTATE_ID_UPDATE, machineId)
        }

        /**
         * settings
         * @param ms update loop interval (ms)
         */
        export function settings(ms: number) {
            if (!_initialized) {
                _updateLoopInterval = ms
            }
        }

        /**
         * create StateMachine
         * @param machineId machine ID
         * @returns instance of StateMachine
         */
        function _createNewStateMacnhe(machineId: number) {
            return new mmachine.StateMachine(machineId, function () {
                _idleUpdate(machineId)
            })
        }

        /**
         * get or create StateMachine
         * @param machineId machine ID
         * @returns instance of StateMachine
         */
        export function getStateMachine(machineId: number) {
            const obj = stateMachineList.find(item => machineId == item.machineId)
            if (obj) {
                return obj
            }
            const newObj = _createNewStateMacnhe(machineId)
            stateMachineList.push(newObj)
            return newObj
        }

        /**
         * get or create State of StateMachine
         * @param machineId machine ID
         * @param stateId state ID
         * @returns instance of State
         */
        export function getState(machineId: number, stateId: number): mmachine.State {
            return getStateMachine(machineId).getStateOrNew(stateId)
        }
    }

    /**
     * Internal event settings
     * @param aStateMachine StateMachines
     * @param eventId Event ID
     * @param ms Event loop interval (default: 100ms)
     */
    //% block="settings $aStateMachine event ID: $eventId every: $ms ms"
    //% aStateMachine.defl=StateMachines.M0
    //% eventId.defl=33797
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    //% deprecated
    export function settingsMachineEvent(aStateMachine: StateMachines, eventId: number, ms: number) {
        mcontroller.settings(ms)
    }

    /**
     * Internal event settings
     * @param ms Event loop interval (default: 100ms)
     */
    //% block="settings $ms ms"
    //% ms.shadow="timePicker"
    //% ms.defl=100
    //% weight=190
    //% advanced=true
    export function settings(ms: number) {
        mcontroller.settings(ms)
    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run
     */
    //% block="define $aStateMachine $mstateId to $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string, body: () => void) {
        mcontroller.defineState(aStateMachine, mname.getNameIdOrNew(aStateName), body)
    }

    /**
     * declare ENTRY action.
     * @param body code to run
     */
    //% block="mstate on entry"
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(body: () => void) {
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
    export function declareDo(aEvery: number, body: () => void) {
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
    export function declareExit(body: () => void) {
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
    export function declareSimpleTransition(aTriggerName: string, aToName: string) {
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
    export function declareTimeoutedTransition(aMs: number, aToName: string) {
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
    export function declareCustomTransition(aTriggerName: string, aTransList: string[], body: () => void) {
        const triggerId = mname.getNameIdOrNew(aTriggerName)
        const toStateIdList: number[] = []
        for (const s of aTransList) {
            toStateIdList.push(mname.getNameIdOrNew(s))
        }
        const [machineId, stateId] = mcontroller.getDefineState()
        mcontroller.getState(machineId, stateId).transitions.push(new mmachine.Transition(toStateIdList, triggerId, body))
        // uml
        _simuTransitionUml(machineId, stateId, toStateIdList)
    }

    /**
     * is timeouted.
     * @param aStateMachine StateMachines
     * @param aMs timeout (milliseconds)
     */
    //% block="mstate $aStateMachine timeouted $aMs"
    //% aStateMachine.defl=StateMachines.M0
    //% aMs.shadow="timePicker"
    //% weight=110
    //% group="Transition"
    export function isTimeouted(aStateMachine: StateMachines, aMs: number): boolean {
        return control.millis() > mcontroller.getStateMachine(aStateMachine).tickOnInto + aMs
    }

    /**
     * trigger args.
     * @param aStateMachine StateMachines
     * @returns trigger args
     */
    //% block="mstate $aStateMachine trigger args"
    //% aStateMachine.defl=StateMachines.M0
    //% weight=105
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aStateMachine: StateMachines,): number[] {
        return mcontroller.getStateMachine(aStateMachine).triggerArgs
    }

    /**
     * transit to.
     * @param aStateMachine StateMachines
     * @param index states index]
     */
    //% block="mstate $aStateMachine transit at $index"
    //% aStateMachine.defl=StateMachines.M0
    //% index.defl=0
    //% weight=100
    //% group="Transition"
    export function transitTo(aStateMachine: StateMachines, index: number) {
        mcontroller.getStateMachine(aStateMachine).selectedToAt = index
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
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendTriggerArgs(aStateMachine: StateMachines, aTriggerName: string, aTriggerArgs: number[]) {
        const triggerId = mname.getNameIdOrNew(aTriggerName)
        mcontroller.getStateMachine(aStateMachine).send(triggerId, aTriggerArgs)
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
        mcontroller.initialize()
        const stateId = mname.getNameIdOrNew(aStateName)
        mcontroller.getStateMachine(aStateMachine).start(stateId)
    }

}
