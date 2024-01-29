#ifndef MSTATE_H
#define MSTATE_H
/**
 * micro:bit Message Bus ID of listener : 1-65535
 * Custom Message Bus ID : 32768-65535
 * https://github.com/jp-rad/pxt-ubit-extension/blob/master/doc/CustomMicroBit.h 
 */
enum MSTATE_BUS_ID
{
        /**
         * MState Update Event Bus ID.
         * (32768 + 1024 + 5 = 33797)
        */
        MSTATE_ID_UPDATE = 33797,
        // https://github.com/jp-rad/pxt-mstate/       
};

#endif // #ifndef MSTATE_H
