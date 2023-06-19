/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";
import {ActionMessage} from "@workadventure/iframe-api-typings";

console.log('Script started successfully');

// Waiting for the API to be ready
WA.onInit().then(async () => {
    console.log('Scripting API ready');

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
    }).catch(e => console.error(e));

    await WA.players.configureTracking({
        players: true,
        movement: false,
    });

    // The doorState variable contains the state of the door.
    // True: the door is open
    // False: the door is closed
    // We listen to variable change to display the correct door image.
    WA.state.onVariableChange('doorState').subscribe((doorState) => {
        displayDoor(doorState);
    });

    displayDoor(WA.state.doorState);

    let openCloseMessage: ActionMessage | undefined;

    // When someone walks on the doorstep (inside the room), we display a message to explain how to open or close the door
    WA.room.onEnterLayer('doorsteps/inside_doorstep').subscribe(() => {
        openCloseMessage = WA.ui.displayActionMessage({
            message: "Press 'space' to open/close the door",
            callback: () => {
                WA.state.doorState = !WA.state.doorState;
            }
        });
    });

    // When someone leaves the doorstep (inside the room), we remove the message
    WA.room.onLeaveLayer('doorsteps/inside_doorstep').subscribe(() => {
        if (openCloseMessage !== undefined) {
            openCloseMessage.remove();
        }
    });

    WA.room.onEnterLayer('meetingRoom').subscribe(() => {
        WA.player.state.saveVariable("currentRoom", "meetingRoom", {
            public: true,
            persist: false
        });
    });

    WA.room.onLeaveLayer('meetingRoom').subscribe(() => {
        WA.player.state.saveVariable("currentRoom", undefined, {
            public: true,
            persist: false
        });
    });

    // When someone walks on the doorstep (outside the room), we check if the door is closed
    // If the door is closed, and if no one is inside (because no player has the "currentRoom" variable set to "meetingRoom"),
    // we open the door automatically.
    WA.room.onEnterLayer('doorsteps/outside_doorstep').subscribe(() => {
        if (WA.state.doorState === false) {
            const players = WA.players.list();
            for (const player of players) {
                if (player.state.currentRoom === "meetingRoom") {
                    // Someone is in the room
                    return;
                }
            }
            // If no one is in the room and if the door is closed, we open it automatically
            WA.state.doorState = true;
        }
    });

}).catch(e => console.error(e));

/**
 * Display the correct door image depending on the state of the door.
 */
function displayDoor(state: unknown) {
    if (state === true) {
        WA.room.showLayer('door/door_opened');
        WA.room.hideLayer('door/door_closed');
    } else {
        WA.room.hideLayer('door/door_opened');
        WA.room.showLayer('door/door_closed');
    }
}

export {};
