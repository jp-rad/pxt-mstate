/// <reference path="mmachine.ts" />
/// <reference path="mstateuml.ts" />

enum StateMachines {
    M0 = 0,
    M1,
    M2,
    M3,
    M4,
    M5
}

/**
 * mstate blocks: The pxt-mstate extension is a user-defined extension for micro:bit that simplifies state machine coding and visualization using block coding and state diagrams.
 */
//% weight=100 color="#40A070" icon="\uf362"
//% groups="['Command', 'Declare', 'Transition', 'UML]"
namespace mstate {

    /**
     * *device-dependent:* initialize and activate
     */
    namespace deviceSetup {

        mstate._doc = console.log

        mmachine.getElapsedMillis = () =>
            // milliseconds
            control.millis()

        mmachine.queueRunToCompletion = (machineId: number) =>
            // raise event : post run-to-completion event queue for calling back runToCompletion()
            control.raiseEvent(MSTATE_BUS_ID.MSTATE_ID_UPDATE, machineId)

        control.onEvent(MSTATE_BUS_ID.MSTATE_ID_UPDATE, 0, function () {
            // on event : post run-to-completion event queue for calling back runToCompletion()
            const machineId = control.eventValue()
            mmachine.runToCompletion(machineId)
        })

        basic.forever(function () {
            //  do-counter : calling idleTick()
            // loop - 20ms
            mmachine.idleTick()
        })

    }

    /**
     * define state
     * @param aStateMachine StateMachines
     * @param aStateName state name
     * @param body code to run
     */
    //% block="define $aStateMachine state $aStateName"
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% weight=180
    //% group="Declare"
    export function defineState(aStateMachine: StateMachines, aStateName: string, body: () => void) {
        mmachine.defineState(aStateMachine, mmachine.namestore.getNameIdOrNew(aStateName), function () {
            const [enabled, machineId, stateId] = mmachine.getDefineMachineState()
            if (enabled) {
                body()
                // uml
                mstate._simuStateUml(machineId, stateId)
            }
        })
    }

    /**
     * declare entry action.
     * @param body code to run
     */
    //% block="mstate on entry"
    //% handlerStatement
    //% weight=170
    //% group="Declare"
    export function declareEntry(body: () => void) {
        const [enabled, machineId, stateId] = mmachine.getDefineMachineState()
        if (enabled) {
            mmachine.getState(machineId, stateId).entryActionList.push(body)
            // uml
            mstate._simuStateUml(machineId, stateId)
        }
    }

    /**
     * declare doActivity.
     * @param aEvery interval time (milliseconds)
     * @param body code to run
     */
    //% block="mstate on do every $aEvery ms $counter"
    //% aEvery.shadow="timePicker"
    //% aEvery.defl=1000
    //% handlerStatement
    //% draggableParameters
    //% weight=160
    //% group="Declare"
    export function declareDoActivity(aEvery: number, body: (counter: number) => void) {
        const [enabled, machineId, stateId] = mmachine.getDefineMachineState()
        if (enabled) {
            if (mmachine.namestore.NONE_ID != stateId) {
                mmachine.getState(machineId, stateId).doActivityList.push(new mmachine.DoActivity(aEvery, body))
                // uml
                mstate._simuStateUml(machineId, stateId)
            }
        }
    }

    /**
     * declare exit action.
     * @param body code to run
     */
    //% block="mstate on exit"
    //% handlerStatement
    //% weight=150
    //% group="Declare"
    export function declareExit(body: () => void) {
        const [enabled, machineId, stateId] = mmachine.getDefineMachineState()
        if (enabled) {
            mmachine.getState(machineId, stateId).exitActionList.push(body)
            // uml
            mstate._simuStateUml(machineId, stateId)
        }
    }

    /**
     * declare simple transition.
     * @param aTriggerName trigger name
     * @param aTargetName target state name
     */
    //% block="mstate transition trigger $aTriggerName target $aTargetName"
    //% aTriggerName.defl="e"
    //% aTargetName.defl="a"
    //% weight=140
    //% group="Transition"
    export function declareSimpleTransition(aTriggerName: string, aTargetName: string) {
        const [enabled, machineId, _] = mmachine.getDefineMachineState()
        if (enabled) {
            declareStateTransition(aTriggerName, [aTargetName], function () {
                mstate.traverse(machineId, 0)
            })
        }
    }

    /**
     * declare state transition.
     * @param aTriggerName trigger name
     * @param aTargetNameList array of target state name 
     * @param body code to run
     */
    //% block="mstate transition trigger $aTriggerName targets $aTargetNameList"
    //% aTriggerName.defl="e"
    //% draggableParameters="reporter"
    //% handlerStatement
    //% weight=130
    //% group="Transition"
    export function declareStateTransition(aTriggerName: string, aTargetNameList: string[], body: () => void) {
        const [enabled, machineId, stateId] = mmachine.getDefineMachineState()
        if ((enabled) && (mmachine.namestore.NONE_ID != stateId)) {
            const triggerId = mmachine.namestore.getNameIdOrNew(aTriggerName)
            const targetIdList: number[] = []
            for (const s of aTargetNameList) {
                targetIdList.push(mmachine.namestore.getNameIdOrNew(s))
            }
            mmachine.getState(machineId, stateId).stateTransitionList.push(new mmachine.StateTransition(triggerId, targetIdList, body))
            // uml
            mstate._simuTransitionUml(machineId, stateId)
        }
    }

    /**
     * get trigger args.
     * @param aStateMachine StateMachines
     */
    //% block="mstate $aStateMachine trigger args"
    //% aStateMachine.defl=StateMachines.M0
    //% weight=120
    //% group="Transition"
    //% advanced=true
    export function getTriggerArgs(aStateMachine: StateMachines,): number[] {
        return mmachine.getStateMachine(aStateMachine).triggerArgs
    }

    /**
     * traverse, select target index
     * @param aStateMachine StateMachines
     * @param index target index, cancled = (-1)
     */
    //% block="mstate $aStateMachine traverse at $index"
    //% aStateMachine.defl=StateMachines.M0
    //% index.defl=0
    //% weight=110
    //% group="Transition"
    export function traverse(aStateMachine: StateMachines, index: number) {
        mmachine.getStateMachine(aStateMachine).traverseAt = index
    }

    /**
     * send trigger
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     */
    //% block="send $aStateMachine $aTriggerName"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=100
    //% group="Command"
    export function sendTrigger(aStateMachine: StateMachines, aTriggerName: string) {
        sendTriggerArgs(aStateMachine, aTriggerName, [])
    }

    /**
     * send trigger with args
     * @param aStateMachine StateMachines
     * @param aTriggerName trigger name
     * @param aTriggerArgs trigger args
     */
    //% block="send $aStateMachine $aTriggerName $aTriggerArgs"
    //% aStateMachine.defl=StateMachines.M0
    //% aTriggerName.defl="e"
    //% weight=90
    //% group="Command"
    //% advanced=true
    export function sendTriggerArgs(aStateMachine: StateMachines, aTriggerName: string, aTriggerArgs: number[]) {
        const triggerId = mmachine.namestore.getNameIdOrNew(aTriggerName)
        mmachine.getStateMachine(aStateMachine).send(triggerId, aTriggerArgs)
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
        const stateId = mmachine.namestore.getNameIdOrNew(aStateName)
        mmachine.getStateMachine(aStateMachine).send(mmachine.namestore.SYS_START_TRIGGER_ID, [stateId])    // StarterTransition
    }

    /**
     * UML, export
     * @param aStateMachine StateMachines
     * @param aStateName default state name
     * @param aMode output state-diagram, trigger table, JSON-diagram
     */
    //% block="(UML) $aStateMachine $aStateName||$aMode"
    //% inlineInputMode=inline
    //% aStateMachine.defl=StateMachines.M0
    //% aStateName.defl="a"
    //% aMode.defl=ModeExportUML.Both
    //% weight=70
    //% group="UML"
    //% advanced=true
    //% shim=mstate::dummy_exportUml
    export function exportUml(aStateMachine: StateMachines, aStateName: string, aMode: ModeExportUML = ModeExportUML.Both) {
        // uml
        mstate._simuExportUml(aStateMachine, aStateName, aMode)
    }

    /**
     * UML, description
     * @param aDescription description
     */
    //% block="(UML) description $aDescription"
    //% aDescription.defl="a"
    //% weight=60
    //% group="UML"
    //% advanced=true
    //% shim=mstate::dummy_descriptionUml
    export function descriptionUml(aDescription: string) {
        // uml
        mstate._simuDescriptionUml(aDescription)
    }

    /**
     * UML, descriptions
     * @param aDescriptionList array of description
     */
    //% block="(UML) descriptions $aDescriptionList"
    //% weight=50
    //% group="UML"
    //% advanced=true
    //% shim=mstate::dummy_descriptionsUml
    export function descriptionsUml(aDescriptionList: string[]) {
        // uml
        mstate._simuDescriptionsUml(aDescriptionList)
    }

}
