/**
 * controller
 */
namespace mcontroller {
    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
    const UPDATE_EVENT_VALUE_BASE = 0x100
    const DEFAULT_EVENT_LOOP_INTERVAL = 100

    export class StateMachineController {

        // micro:bit events/loops
        _initialized: boolean
        _updateEventId: number
        _updateEventValue: number   // non-zero values, zero is wildcard (MICROBIT_EVT_ANY).
        _eventLoopInterval: number

        /**
         * state machine
         */
        stateMachine: mmachine.StateMachine

        /**
         * constructor
         * @param machineId state machine ID
         */
        constructor(machineId: number) {
            // micro:bit events/loops
            this._initialized = false
            this._updateEventId = DEFAULT_UPDATE_EVENT_ID
            this._updateEventValue = machineId + UPDATE_EVENT_VALUE_BASE
            this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
            // StateMachine
            const that: StateMachineController = this
            this.stateMachine = new mmachine.StateMachine(machineId, () => {
                that.idleUpdate()
            })
        }

        idleUpdate(): void {
            // update event
            control.raiseEvent(this._updateEventId, this._updateEventValue)
        }

        settings(eventId: number, ms: number) {
            if (!this._initialized) {
                this._updateEventId = eventId
                this._eventLoopInterval = ms
            }
        }

        start(stateId: number): boolean {
            if (!this._initialized) {
                this._initialized = true
                const that: StateMachineController = this
                // update event handler
                control.onEvent(that._updateEventId, that._updateEventValue, function () {
                    that.stateMachine.update()
                })
                // update event loop
                loops.everyInterval(that._eventLoopInterval, function () {
                    that.idleUpdate()
                })
            }
            return this.stateMachine.start(stateId)
        }

        send(triggerId: number, triggerArgs: number[]) {
            this.stateMachine.send(triggerId, triggerArgs)
        }
    }

    // state machine
    let stateMachineControllerList: StateMachineController[] = []

    /**
     * get or create StateMachine controller
     * @param machineId machine ID
     * @returns instance of StateMachine controller
     */
    export function getStateMachineController(machineId: number) {
        if (0 >= machineId) {
            return undefined
        }
        const obj = stateMachineControllerList.find(item => machineId == item.stateMachine.machineId)
        if (obj) {
            return obj
        }
        const newObj = new StateMachineController(machineId)
        stateMachineControllerList.push(newObj)
        return newObj
    }
}