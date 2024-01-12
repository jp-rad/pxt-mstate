/**
 * controller
 */
namespace mcontroller {

    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 0x100
    const UPDATE_EVENT_VALUE_BASE = 0x100
    const DEFAULT_UPDATE_LOOP_INTERVAL = 100

    let _defineMachineId: StateMachines = undefined
    let _defineStateId: number = undefined

    export function defineState(machineId: number, stateId: number, body: () => void) {
        
        _defineMachineId = machineId
        _defineStateId = stateId
        body()
        _defineMachineId = undefined
        _defineStateId = undefined
    }

    export function getDefineState() {
        return [_defineMachineId, _defineStateId]
    }

    // state machine
    let stateMachineList: mmachine.StateMachine[] = []

    // update event/loop
    let _initialized: boolean = false
    let _updateEventId: number = DEFAULT_UPDATE_EVENT_ID
    let _updateLoopInterval: number = DEFAULT_UPDATE_LOOP_INTERVAL

    export function initialize(): void {
        if (!_initialized) {
            _initialized = true
            // update event handler
            control.onEvent(_updateEventId, 0, function () {
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

    function _idleUpdate(machineId: number) {
        control.raiseEvent(_updateEventId, machineId)
    }

    export function settings(eventId: number, ms: number) {
        if (!_initialized) {
            _updateEventId = eventId
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