/**
 * controller
 */
namespace mcontroller {
    const MICROBIT_CUSTOM_ID_BASE = 32768
    const DEFAULT_UPDATE_EVENT_ID = MICROBIT_CUSTOM_ID_BASE + 100
    const UPDATE_EVENT_VALUE_BASE = 0x100
    const DEFAULT_EVENT_LOOP_INTERVAL = 100

    export class Controller {

        // system
        _initialized: boolean
        _updateEventId: number
        _updateEventValue: number   // non-zero values, zero is wildcard (MICROBIT_EVT_ANY).
        _eventLoopInterval: number

        stateMachine: mmachine.StateMachine

        /**
         * constructor
         * The state machine ID is used as the event value, so it must be greater than 0
         * @param machine state machine ID (>0)
         */
        constructor(machine: number) {
            // system
            this._initialized = false
            this._updateEventId = DEFAULT_UPDATE_EVENT_ID
            this._updateEventValue = machine + UPDATE_EVENT_VALUE_BASE
            this._eventLoopInterval = DEFAULT_EVENT_LOOP_INTERVAL
            const that: Controller = this
            this.stateMachine = new mmachine.StateMachine(machine, () => {
                // update event
                control.raiseEvent(that._updateEventId, that._updateEventValue)
            })
        }

        settings(eventId: number, ms: number) {
            if (!this._initialized) {
                this._updateEventId = eventId
                this._eventLoopInterval = ms
            }
        }

        start(state: number): boolean {
            if (!this._initialized) {
                this._initialized = true
                const that: Controller = this
                // update event handler
                control.onEvent(that._updateEventId, that._updateEventValue, function () {
                    that.stateMachine.update()
                })
                // update event loop
                loops.everyInterval(that._eventLoopInterval, function () {
                    control.raiseEvent(that._updateEventId, that._updateEventValue)
                })
            }
            return this.stateMachine.start(state)
        }

        send(trigger: number, args: number[]) {
            this.stateMachine.send(trigger, args)
        }
    }

    // state machine
    let stateMachineControllerList: Controller[] = []

    /**
     * get or create StateMachine controller
     * @param machine machine ID (>0)
     * @returns instance of StateMachine controller
     */
    export function getStateMachineController(machine: number) {
        if (0 >= machine) {
            return undefined
        }
        const obj = stateMachineControllerList.find(item => machine == item.stateMachine.machine)
        if (obj) {
            return obj
        }
        const newObj = new Controller(machine)
        stateMachineControllerList.push(newObj)
        return newObj
    }
}