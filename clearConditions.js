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
            
            // Record the actor's current CON value
            let speed = ageSystemActor.data.data.speed.total;
            
            // Check for a baseConValue flag
            let baseSpeed = ageSystemActor.getFlag("world", "baseSpeed");
            
            // If there is a baseConValue flag set...
            if (baseSpeed != undefined) {
                // And if the current CON is less than the baseConValue
                if (speed < baseSpeed) {
                    speed = baseSpeed;
                }
            }
            
            await setConditions(ageSystemActor, false, conValue);

            ageSystemActor.handleConditions("blinded", false);
            ageSystemActor.handleConditions("deafened", false);
            ageSystemActor.handleConditions("dying", false);
            ageSystemActor.handleConditions("exhausted", false);
            ageSystemActor.handleConditions("fatigued", false);
            ageSystemActor.handleConditions("freefalling", false);
            ageSystemActor.handleConditions("helpless", false);
            ageSystemActor.handleConditions("hindered", false);
            ageSystemActor.handleConditions("injured", false);
            ageSystemActor.handleConditions("prone", false);
            ageSystemActor.handleConditions("restrained", false);
            ageSystemActor.handleConditions("unconscious", false);
            ageSystemActor.handleConditions("wounded", false);

            // Get the speaker for this token
            let this_speaker = ChatMessage.getSpeaker({token: token});

            // Send a friendly chat message from this token
            ChatMessage.create({speaker: this_speaker, content: flavor}); // All set, boss!
        });
    }
}

clearConditions();