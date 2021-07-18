/* This macro is specific to the AGE System (unoffical) game system.
 *
 * This macro requires that the game system be "age-system" so that
 * the actor will have the appropriate structure.
 * 
 * Author: schlosrat
 */

async function setConditions(ageSystemActor, setting, conValue) {
    // Do all the updates in a single call to minimize trips to the backend
    await ageSystemActor.update({
        "data": {
            "conditions.blinded": setting,
            "conditions.deafened": setting,
            "conditions.dying": setting,
            "conditions.exhausted": setting,
            "conditions.fatigued": setting,
            "conditions.freefalling": setting,
            "conditions.helpless": setting,
            "conditions.hindered": setting,
            "conditions.injured": setting,
            "conditions.prone": setting,
            "conditions.restrained": setting,
            "conditions.unconscious": setting,
            "conditions.wounded": setting,
            "abilities.cons.value": conValue,
        }
    });
}

async function clearConditions () {
    if (game.system.id === 'age-system') {

        // Get the list of all the selected tokens
        const selected = canvas.tokens.controlled;
        
        // For each selected token...
        selected.forEach(async (token) => {

            // Get the actor for this token
            let ageSystemActor = token.actor;
            
            // Set the flavor to use in the chat message
            let flavor = "All set, boss!"
            if (ageSystemActor.data.data.ancestry === "Belter") flavor = "Kowl set, bosmang!";
            // Get the abilities for this actor
            // let abilities = ageSystemActor.data.data.abilities;
            
            // Record the actor's current CON value
            let conValue = ageSystemActor.data.data.abilities.cons.value;
            
            // Check for a baseConValue flag
            let baseCon = ageSystemActor.getFlag("world", "baseConValue");
            
            // If there is a baseConValue flag set...
            if (baseCon != undefined) {
                // And if the current CON is less than the baseConValue
                if (conValue < baseCon) {
                    conValue = baseCon;
                }
            }
            
            await setConditions(ageSystemActor, false, conValue);

            await ageSystemActor.handleConditions("blinded", false);
            await ageSystemActor.handleConditions("deafened", false);
            await ageSystemActor.handleConditions("dying", false);
            await ageSystemActor.handleConditions("exhausted", false);
            await ageSystemActor.handleConditions("fatigued", false);
            await ageSystemActor.handleConditions("freefalling", false);
            await ageSystemActor.handleConditions("helpless", false);
            await ageSystemActor.handleConditions("hindered", false);
            await ageSystemActor.handleConditions("injured", false);
            await ageSystemActor.handleConditions("prone", false);
            await ageSystemActor.handleConditions("restrained", false);
            await ageSystemActor.handleConditions("unconscious", false);
            await ageSystemActor.handleConditions("wounded", false);

            // Check for a flag for injured, clear it if it's there
            if (ageSystemActor.getFlag("world", "injured") != undefined) {
                await ageSystemActor.setFlag("world", "injured", false);
            }

            // Check for a flag for wounded, clear it if it's there
            if (ageSystemActor.getFlag("world", "wounded") != undefined) {
                await ageSystemActor.setFlag("world", "wounded", false);
            }

            // Check for a flag for unconscious, clear it if it's there
            if (ageSystemActor.getFlag("world", "unconscious") != undefined) {
                await ageSystemActor.setFlag("world", "unconscious", false);
            }

            // Check for a flag for dying, clear it if it's there
            if (ageSystemActor.getFlag("world", "dying") != undefined) {
                await ageSystemActor.setFlag("world", "dying", false);
            }

            // Get the speaker for this token
            let this_speaker = ChatMessage.getSpeaker({token: token});

            // Send a friendly chat message from this token
            ChatMessage.create({speaker: this_speaker, content: flavor}); // All set, boss!
        });
    }
}

clearConditions();