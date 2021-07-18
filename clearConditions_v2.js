/* This macro is specific to the AGE System (unoffical) game system.
 *
 * This macro requires that the game system be "age-system" so that
 * the actor will have the appropriate structure.
 * 
 * Author: schlosrat
 */

/**
 * Remove a condition (AGE System dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 */
 const removeCondition = async (thisActor, condId) => {
    /* THIS IS THE EXAMPLE TO REMOVE A CONDITION - async function */
    // This removes condition Active Effects - AGE System code will take care of checked/unchecked boxes and token statuses
    let remove = [];
    // this loop will capture all Active Effects causing the condId condition and delete all of them.
    thisActor.effects.map(e => {
        const isCondition = (e.data.flags?.["age-system"]?.type === "conditions") ? true : false;
        const isId = (e.data.flags?.["age-system"]?.name === condId) ? true : false;
        if (isCondition && isId) remove.push(e.data._id);
    });
    await thisActor.deleteEmbeddedDocuments("ActiveEffect", remove);
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
                    // await setConditions(ageSystemActor, false, conValue);
                    await ageSystemActor.update({
                        "data.abilities.cons.value": conValue,
                        }
                    );
                }
            }
            
            await removeCondition(ageSystemActor, "blinded");
            await removeCondition(ageSystemActor, "deafened");
            await removeCondition(ageSystemActor, "dying");
            await removeCondition(ageSystemActor, "exhausted");
            await removeCondition(ageSystemActor, "fatigued");
            await removeCondition(ageSystemActor, "freefalling");
            await removeCondition(ageSystemActor, "helpless");
            await removeCondition(ageSystemActor, "hindered");
            await removeCondition(ageSystemActor, "injured");
            await removeCondition(ageSystemActor, "prone");
            await removeCondition(ageSystemActor, "restrained");
            await removeCondition(ageSystemActor, "unconscious");
            await removeCondition(ageSystemActor, "wounded");

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
            let this_speaker = ChatMessage.getSpeaker({token: token.document});

            // Send a friendly chat message from this token
            ChatMessage.create({speaker: this_speaker, content: flavor}); // All set, boss!
        });
    }
}

clearConditions();