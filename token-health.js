// @ts-check

import settings, {CONFIG} from './settings.js';
import {i18n} from './ui.js';
import getNewHP from './getNewHP.js';

const DELAY = 400;

let tokenHealthDisplayed = false;
let dialog, timer, KeyBinding;

/**
 * Extend Dialog class to force focus on the input
 */
class TokenHealthDialog extends Dialog {
  activateListeners(html) {
    super.activateListeners(html);

    // Focus the input
    html.find('#token-health-input').focus();

    // Add a class to dialog-buttons to be able to style them without breaking other stuff :/
    html.addClass('token-health');
  }
}

/**
 * Apply damage, use the Actor5e formula
 *
 * @param {HTMLElement} html The html element
 * @param {boolean} isDamage Is the amount a damage? false if it's healing
 * @param {boolean} isTargeted Is it a targeted token?
 * @returns {Promise<Entity|Entity[]>}
 */
const applyDamage = async (html, isDamage, isTargeted) => {
  const value = html.find('input[type=number]').val();
  const damage = isDamage ? Number(value) : Number(value) * -1;

  // Set AGE-system specific things
  // useConditions controls if we use conditions for everything (if true) or only
  // for tacking actor health status (if false)
  let useConditions = false; // Default to false for non AGE-System games
  // AGE-System games and allow for different damage types of 
  //   Impact (mitigated by any armor type and toughness)
  //   Ballisitic (only mitigated by ballistic armor and toughness)
  //   Penetraiting (bypasses all armor and toughness)
  let damageType = "impact";
  // AGE-System games allow for two damage subtypes
  //   Wound (may actually kill the character)
  //   Stun (may at most render the character unconscious)
  let subtype = "wound";
  if (game.system.id === 'age-system') {
    useConditions = game.settings.get("age-system", "useConditions");
    damageType = html.find('[name="damage-type"]')[0].value;
    let wound = html.find('[name="subtype"]')[0].checked;
    let stun = html.find('[name="subtype"]')[1].checked;
    console.log(wound);
    console.log(stun);
    if (wound) {
      subtype = "wound";
    } else {
      subtype = "stun";
    }
  }
  //if (useConditions === undefined) useConditions = false;

  // Get the control paramater for enabling/disabling token chat
  let enableChat = CONFIG.ENABLE_TOKEN_CHAT;

  // Get the thresholds for Unconscious and Death/Dying
  let koThreshold    = CONFIG.KO_THREASHOLD;
  let deathThreshold = CONFIG.DEATH_THREASHOLD;
  if (koThreshold === undefined) koThreshold = 0;
  if (deathThreshold === undefined) deathThreshold = 0;
  if (!Number.isInteger(koThreshold)) koThreshold = Math.round(koThreshold);
  if (!Number.isInteger(deathThreshold)) deathThreshold = Math.round(deathThreshold);
  if (!CONFIG.ALLOW_NEGATIVE) {
    if (koThreshold != undefined){
      if (koThreshold < 0) koThreshold = 0;
    }
    if (deathThreshold < 0) deathThreshold = 0;
  }

  // DEBUG TEST CODE - REMOVE! //
  // console.log(deathThreshold)
  // console.log(koThreshold)

  // This controls if damage buyoff is allowed (injured/wounded/dying)
  // verses going straight to dying when health gets to 0.
  const allowDamageBuyoff = CONFIG.ALLOW_DAMAGE_BUYOFF;

  const tokens = isTargeted
    ? Array.from(game.user.targets)
    : canvas.tokens.controlled;


  const promises = tokens.map(({actor}) => {
    // Handle temp hp if any
    const data = actor.data.data;
    const hp = getProperty(data, CONFIG.HITPOINTS_ATTRIBUTE);
    const max = getProperty(data, CONFIG.MAX_HITPOINTS_ATTRIBUTE);
    const temp = getProperty(data, CONFIG.TEMP_HITPOINTS_ATTRIBUTE);

    let isInjured     = false;
    let isWounded     = false;
    let isUnconscious = false;
    let isDying       = false;
  
    // Make sure we've got a flag for injured, get it if we do
    if (actor.getFlag("world", "injured") === undefined) {
      actor.setFlag("world", "injured", isInjured);
    } else {
      isInjured = actor.getFlag("world", "injured");
    }

    // Make sure we've got a flag for wounded, get it if we do
    if (actor.getFlag("world", "wounded") === undefined) {
      actor.setFlag("world", "wounded", isWounded);
    } else {
      isWounded = actor.getFlag("world", "wounded");
    }

    // Make sure we've got a flag for unconscious, get it if we do
    if (actor.getFlag("world", "unconscious") === undefined) {
      actor.setFlag("world", "unconscious", isUnconscious);
    } else {
      isUnconscious = actor.getFlag("world", "unconscious");
    }

    // Make sure we've got a flag for dying, get it if we do
    if (actor.getFlag("world", "dying") === undefined) {
      actor.setFlag("world", "dying", isDying);
    } else {
      isDying = actor.getFlag("world", "dying");
    }

    // Default to full damage applied
    let dapplied = damage;

    // Handle damage mitigation if allowed
    let mit1 = 0;
    let mit2 = 0;
    let mit3 = 0;
    let mit  = 0;
    if (damageType != "penetrating") {
      // Get the mitigation attributed
      mit1 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_1);
      mit2 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_2);
      mit3 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_3);
      // Mitigation is only applied to damange, and not healing
      if (damage > 0) {
        if (mit1 != undefined) {
          mit = mit + mit1;
        }
        if ((mit2 != undefined) && (damageType === "impact")) {
          mit = mit + mit2;
        }
        if ((mit3 != undefined) && (damageType === "ballistic")) {
          mit = mit + mit3;
        }
        dapplied = Math.max(damage - mit, 0);
      }
    }

  // DEBUG TEST CODE - REMOVE! //
  // console.log(damage)
  // console.log(mit)
  // console.log(dapplied)

    let anounceGM = '';
    let anouncePlayer = '';
    if (dapplied > 1) {
      anouncePlayer = CONFIG.OUCH;
      anounceGM = dapplied + " " + CONFIG.DAMAGE_POINTS;
    }
    if (dapplied === 1) {
      anouncePlayer = CONFIG.OUCH;
      anounceGM = CONFIG.DAMAGE_POINT;
    }
    if (dapplied === 0) {
      anouncePlayer = CONFIG.MEH;
      anounceGM = anouncePlayer;
    }
    if (dapplied < 0) {
      anouncePlayer = CONFIG.TY;
      if (hp < max) {
        if ((dapplied === -1) || ((max - hp) === 1)) {
          anounceGM = CONFIG.HEALING_POINT;
        } else {
          anounceGM = Math.min(-dapplied, max - hp) + " " + CONFIG.HEALING_POINTS;
        }
      } else {
        anouncePlayer = CONFIG.MEH;
        anounceGM = anouncePlayer;
      }
    }

    if (enableChat) {
      ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
      ChatMessage.create({content: anounceGM, speaker: ChatMessage.getSpeaker({actor: actor}),
        whisper: ChatMessage.getWhisperRecipients("GM")});
    }
    const [newHP, newTempHP] = getNewHP(hp, max, temp, dapplied, {
      allowNegative: CONFIG.ALLOW_NEGATIVE,
    });

    // Deal with all cases that could result in Injured/Wounded/Dying conditions
    if ((hp - dapplied) < deathThreshold) {
      if (allowDamageBuyoff) {
        // call ageDamageBuyoff to handle any excess damage
        ageDamageBuyoff(actor, dapplied - hp);
      } else {
        // They're going down!
        ageNoDamageBuyoff(actor, dapplied - hp);
      }
    } else if (koThreshold != undefined) {
      if ((hp - dapplied) < koThreshold) {
        // Set KO State
        isUnconscious = true;
        actor.setFlag("world", "unconscious", isUnconscious);
        // Announce KO State
        anouncePlayer = CONFIG.UNCONSCIOUS;
        if (enableChat) ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
      }
    }

    // If healing was applied
    if (dapplied < 0) {
      // If charcater was unconcious and this raises HP above koThreshold
      if (newHP > koThreshold && isUnconscious) isUnconscious = false;
      // If charcater was dying and this raises HP above deathThreshold
      if (newHP > deathThreshold && isDying) isDying = false;
      if (!CONFIG.ALLOW_DAMAGE_BUYOFF && !isDying && !isUnconscious) {
        isInjured = false;
        isWounded = false;
      }
      actor.setFlag("world", "injured", isInjured);
      actor.setFlag("world", "wounded", isWounded);
      actor.setFlag("world", "unconscious", isUnconscious);
      actor.setFlag("world", "dying", isDying);
      if (game.system.id === 'age-system') {
        if (useConditions) { // if useing conditions only cure dying/helpless/unconscious
          actor.update({
            "data": {
              "conditions.dying": false,
              "conditions.helpless": false,
              "conditions.unconscious": false,
            }
          });
        } else { // If not useing conditions then all conditions should be false
          actor.update({
            "data": {
              "conditions.dying": false,
              "conditions.helpless": false,
              "conditions.unconscious": false,
              "conditions.injured": false,
              "conditions.wounded": false,
              "conditions.fatigued": false,
              "conditions.exhausted": false,
              "conditions.prone": false,
            }
          });
        }
      }
    }

    let updates = {}
    if (temp != undefined) {
      updates = {
        _id: actor.id,
        isToken: actor.isToken,
        [`data.${CONFIG.HITPOINTS_ATTRIBUTE || 'attributes.hp.value'}`]: newHP,
        [`data.${
          CONFIG.TEMP_HITPOINTS_ATTRIBUTE || 'attributes.hp.temp'
        }`]: newTempHP,
      };
    } else {
      updates = {
        _id: actor.id,
        isToken: actor.isToken,
        [`data.${CONFIG.HITPOINTS_ATTRIBUTE || 'attributes.hp.value'}`]: newHP,
      };
    }

    // Prepare the update
    return actor.update(updates);
  });

  return Promise.all(promises);
};

/**
 * Apply spillover damage (AGE system specific)
 *
 * @param {actor} thisActor The actor being to apply conditions to
 * @param {number} dRemaining the damage remaing to be accounted for
 */
const ageDamageBuyoff = async(thisActor, dRemaining) => {
  let conditions;
  let abilities;
  // let speed;
  let origin;
  let flavor1 = CONFIG.INJURED;
  let flavor2 = CONFIG.WOUNDED;
  let flavor3 = CONFIG.DYING;
  let flavor4 = CONFIG.DEAD;
  let isExhausted   = false;
  let isFatigued    = false;
  let isInjured     = false;
  let isWounded     = false;
  let isUnconscious = false;
  let isDying       = false;
  let isProne       = false;
  let isFreefalling = false;
  let isHelpless    = false;
  // let speedMod      = 0;
  // let speedTotal    = 0;
  let useConditions = false;

  // Get the control paramater for enabling/disabling token chat
  let enableChat = CONFIG.ENABLE_TOKEN_CHAT;

  // Make sure we've got a flag for injured, get it if we do
  if (thisActor.getFlag("world", "injured") === undefined) {
    thisActor.setFlag("world", "injured", isInjured);
  } else {
    isInjured = thisActor.getFlag("world", "injured");
  }

  // Make sure we've got a flag for wounded, get it if we do
  if (thisActor.getFlag("world", "wounded") === undefined) {
    thisActor.setFlag("world", "wounded", isWounded);
  } else {
    isWounded = thisActor.getFlag("world", "wounded");
  }

  // Make sure we've got a flag for unconscious, get it if we do
  if (thisActor.getFlag("world", "unconscious") === undefined) {
    thisActor.setFlag("world", "unconscious", isUnconscious);
  } else {
    isUnconscious = thisActor.getFlag("world", "unconscious");
  }

  // Make sure we've got a flag for dying, get it if we do
  if (thisActor.getFlag("world", "dying") === undefined) {
    thisActor.setFlag("world", "dying", isDying);
  } else {
    isDying = thisActor.getFlag("world", "dying");
  }

  if (game.system.id === 'age-system') {
    useConditions = game.settings.get("age-system", "useConditions");
    conditions = thisActor .data.data.conditions;
    abilities = thisActor .data.data.abilities;
    // speed = thisActor .data.data.speed;
    origin = thisActor .data.data.ancestry;

    // Get the AGE-specific conditions and attributes needed
    // This allows other mods and macros to override this mod
    isExhausted   = conditions.exhausted;
    isFatigued    = conditions.fatigued;
    isInjured     = conditions.injured;
    isWounded     = conditions.wounded;
    isDying       = conditions.dying;
    isProne       = conditions.prone;
    isFreefalling = conditions.freefalling;
    isHelpless    = conditions.helpless;
    // speedMod      = speed.mod;
    // speedTotal    = speed.total;

    // Make sure this actor has their baseConValue recorded as a flag
    if (thisActor.getFlag("world", "baseConValue") === undefined) {
      thisActor.setFlag("world", "baseConValue", abilities.cons.value);
    } else if (abilities.cons.value > thisActor.getFlag("world", "baseConValue")) {
      thisActor.setFlag("world", "baseConValue", abilities.cons.value);
    }

    // If the character is a Belter, switch flavor to Lang Belta
    if (origin === "Belter") {
      flavor1 = "Ouch! Deting hurt!";                // English: "Ouch! That hurt!"
      flavor2 = "Kaka felota! Deting REALLY hurt!";  // English: "Shit! That really hurt!"
      flavor3 = "Oyedeng. Tim fo wok wit da stars!"; // English: "Goodbye. Time to walk with the stars!"
      flavor4 = "Oye! na du beat wa det horse!";     // English: "Hey! Don't beat a dead horse!""
    }
  }

  // Get this speaker
  const this_speaker = ChatMessage.getSpeaker({actor: thisActor});

  // If the dying condition is currently set
  if (isDying) { // The case in which more damage is pointless
    // More damage to a dead guy is senseless 
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor4}); // Hey! Don't beat a dead horse!
  } else if (isWounded) { // Damage being applied to a wounded character
    // Set the dying state flag
    isDying = true;
    thisActor.setFlag("world", "dying", isDying);

    // If not freefalling, then character will also be prone
    if (!isFreefalling) isProne = true;

    // If this is an AGE System game
    if (game.system.id === 'age-system') {
      // Set the dying condition
      if (useConditions) {
        // Dying characters are also unconscious, and helpless
        // Helpless characters can't move.
        // Set the actor's speed.mod = -speed.total and speed.total = 0
        thisActor.update({
          "data": {
            "conditions.dying": true,
            "conditions.unconscious": true,
            "conditions.helpless": true,
            "conditions.prone": isProne,
            // "speed.mod": -speed.total,
            // "speed.total": 0,
          }
        });
      } else {
        thisActor.update({
          "data": {
            "conditions.dying": true,
          }
        });
      }
    }
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
  } else if (isInjured) { // Damage being applied to a injured character
    // Set the wounded state flag
    isWounded = true;
    thisActor.setFlag("world", "wounded", isWounded);

    // Buy off 1d6 damage when taking the wounded condition
    let roll1 = new Roll("1d6").roll();

    // Announce the roll
    roll1.toMessage({speaker:{alias:this_speaker.alias}, flavor: flavor2});

    // If this is an AGE System game
    if (game.system.id === 'age-system') {
      // Configure conditions: Add the exhausted condition,
      //    if already exhausted then helpless
      if (isExhausted) {
        isHelpless = true;
        // speedMod = -speed.total;
        // speedTotal = 0;
      } else {
        isExhausted = true;
        // speedMod = -Math.ceil(speed.base/2);
        // speedTotal = speed.total + speedMod;
      }

      // Set the wounded condition
      if (useConditions) {
        thisActor.update({
          "data": {
            "conditions.wounded": true,
            "conditions.exhausted": isExhausted,
            "conditions.helpless": isHelpless,
            // "speed.mod": speedMod,
            // "speed.total": speedTotal,
          }
        });
      } else {
        thisActor.update({
          "data": {
            "conditions.wounded": true,
          }
        });
      }
    }

    if (roll1._total < dRemaining) { // out of options, advance to dying
      // Set the dying state flag
      isDying = true;
      thisActor.setFlag("world", "dying", isDying);

      // Character is wounded but has more damage to account for, so now they're dying!
      // If not freefalling, then character will also be prone
      if (!isFreefalling) isProne = true;

      // If this is an AGE System game
      if (game.system.id === 'age-system') {
        // Set the dying condition
        if (useConditions) {
          // Dying characters are also unconscious, and helpless
          // Helpless characters can't move.
          // Set the actor's speed.mod = -speed.total and speed.total = 0
          thisActor.update({
            "data": {
              "conditions.dying": true,
              "conditions.unconscious": true,
              "conditions.helpless": true,
              "conditions.prone": isProne,
              // "speed.mod": -speed.total,
              // "speed.total": 0,
            }
          });
        } else {
          thisActor.update({
            "data": {
              "conditions.dying": true,
            }
          });
        }
      }
      if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
    }
  } else {  // Damage being applied to an uninjured character
    // Set the injured state flag
    isInjured = true;
    thisActor.setFlag("world", "injured", isInjured);

    // Buy off 1d6 damage when taking the injured condition
    let roll1 = new Roll("1d6").roll();
    
    // Announce the roll
    roll1.toMessage({speaker: {alias:this_speaker.alias}, flavor: flavor1});

    // If this is an AGE System game
    if (game.system.id === 'age-system') {
      // Configure conditions: Add the fatigued condition,
      //    if already fatigued then exhausted,
      //    if already exhausted then helpless
      if (isExhausted) {
        isHelpless = true;
        // speedMod = -speed.total;
        // speedTotal = 0;
      } else if (isFatigued) {
        isExhausted = true;
        // speedMod = -Math.ceil(speed.base/2);
        // speedTotal = speed.total + speedMod;
      } else isFatigued = true;

      // Set the conditions
      if (useConditions) {
        thisActor.update({
          "data": {
            "conditions.injured": true,
            "conditions.fatigued": isFatigued,
            "conditions.exhausted": isExhausted,
            "conditions.helpless": isHelpless,
            // "speed.mod": speedMod,
            // "speed.total": speedTotal,
          }
        });
      } else {
        thisActor.update({
          "data": {
            "conditions.injured": true,
          }
        });
      }
    }

    if (roll1._total < dRemaining) {
      // Set the wounded state flag
      isWounded = true;
      thisActor.setFlag("world", "wounded", isWounded);

      // Buy off 1d6 damage when taking the wounded condition
      let roll2 = new Roll("1d6").roll();

      // Announce the roll
      roll2.toMessage({speaker: {alias:this_speaker.alias}, flavor: flavor2});

      // If this is an AGE System game
      if (game.system.id === 'age-system') {
        // Configure conditions: Add the exhausted condition,
        //    if already exhausted then helpless
        if (isExhausted) {
          isHelpless = true;
          // speedMod = -speed.total;
          // speedTotal = 0;
        } else {
          isExhausted = true;
          // speedMod = -Math.ceil(speed.base/2);
          // speedTotal = speed.total + speedMod;
        }

        // Set the conditions
        if (useConditions) {
          thisActor.update({
            "data": {
              "conditions.wounded": true,
              "conditions.exhausted": isExhausted,
              "conditions.helpless": isHelpless,
              // "speed.mod": speedMod,
              // "speed.total": speedTotal,
            }
          });
        } else {
          thisActor.update({
            "data": {
              "conditions.wounded": true,
            }
          });
        }
      }
      if ((roll1._total + roll2._total) < dRemaining) {
        // Character is wounded but has more damage to account for, so now they're dying!
        // Set the dying state flag
        isDying = true;
        thisActor.setFlag("world", "dying", isDying);

        // If not freefalling, then character will also be prone
        if (!isFreefalling) isProne = true;

        // If this is an AGE System game
        if (game.system.id === 'age-system') {
          // Set the dying condition
          if (useConditions) {
            // Dying characters are also unconscious, and helpless
            // Helpless characters can't move.
            // Set the actor's speed.mod = -speed.total and speed.total = 0
            thisActor.update({
              "data": {
                "conditions.dying": true,
                "conditions.unconscious": true,
                "conditions.helpless": true,
                "conditions.prone": isProne,
                // "speed.mod": -speed.total,
                // "speed.total": 0,
              }
            });
          } else {
            thisActor.update({
              "data": {
                "conditions.dying": true,
              }
            });
          }
        }
        if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
      }
    }
  }
}

/**
 * Deal with dying - no damage buyoff
 *
 * @param {actor} thisActor The actor being to apply conditions to
 *
 */
 const ageNoDamageBuyoff = async(thisActor) => {
  let conditions;
  let abilities;
  // let speed;
  let origin;
  // let flavor1 = CONFIG.INJURED;
  // let flavor2 = CONFIG.WOUNDED;
  let flavor3 = CONFIG.DYING;
  let flavor4 = CONFIG.DEAD;
  // let isExhausted   = false;
  // let isFatigued    = false;
  // let isInjured     = false;
  // let isWounded     = false;
  let isUnconscious = false;
  let isDying       = false;
  let isProne       = false;
  let isFreefalling = false;
  let isHelpless    = false;
  // let speedMod      = 0;
  // let speedTotal    = 0;
  let useConditions = false;

  // Get the control paramater for enabling/disabling token chat
  let enableChat = CONFIG.ENABLE_TOKEN_CHAT;

  // Make sure we've got a flag for unconscious, get it if we do
  if (thisActor.getFlag("world", "unconscious") === undefined) {
    thisActor.setFlag("world", "unconscious", isUnconscious);
  } else {
    isUnconscious = thisActor.getFlag("world", "unconscious");
  }

  // Make sure we've got a flag for dying, get it if we do
  if (thisActor.getFlag("world", "dying") === undefined) {
    thisActor.setFlag("world", "dying", isDying);
  } else {
    isDying = thisActor.getFlag("world", "dying");
  }

  if (game.system.id === 'age-system') {
    useConditions = game.settings.get("age-system", "useConditions");
    conditions = thisActor .data.data.conditions;
    abilities = thisActor .data.data.abilities;
    // speed = thisActor .data.data.speed;
    origin = thisActor .data.data.ancestry;

    // Get the AGE-specific conditions and attributes needed
    // This allows other mods and macros to override this mod
    // isExhausted   = conditions.exhausted;
    // isFatigued    = conditions.fatigued;
    // isInjured     = conditions.injured;
    // isWounded     = conditions.wounded;
    isDying       = conditions.dying;
    isProne       = conditions.prone;
    isFreefalling = conditions.freefalling;
    isHelpless    = conditions.helpless;
    // speedMod      = speed.mod;
    // speedTotal    = speed.total;

    // Make sure this actor has their baseConValue recorded as a flag
    if (thisActor.getFlag("world", "baseConValue") === undefined) {
      thisActor.setFlag("world", "baseConValue", abilities.cons.value);
    } else if (abilities.cons.value > thisActor.getFlag("world", "baseConValue")) {
        thisActor.setFlag("world", "baseConValue", abilities.cons.value);
    }
    if (origin === "Belter") {
      // flavor1 = "Ouch! Deting hurt!";                // English: "Ouch! That hurt!"
      // flavor2 = "Kaka felota! Deting REALLY hurt!";  // English: "Shit! That really hurt!"
      flavor3 = "Oyedeng. Tim fo wok wit da stars!"; // English: "Goodbye. Time to walk with the stars!"
      flavor4 = "Oye! na du beat wa det horse!";     // English: "Hey! Don't beat a dead horse!""
    }
  }

  // Get this speaker
  const this_speaker = ChatMessage.getSpeaker({actor: thisActor});

  // If the dying condition is currently set
  if (isDying) {
    // More damage to a dead guy is senseless 
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor4}); // Hey! Don't beat a dead horse!
  } else {
    // If not freefalling, then character will also be prone
    if (!isFreefalling) isProne = true;

    // Set the dying state flag
    isDying = true;
    thisActor.setFlag("world", "dying", isDying);

    // If this is an AGE System game
    if (game.system.id === 'age-system') {
      // Set the dying condition
      if (useConditions) {
        // Dying characters are also unconscious, and helpless
        // Helpless characters can't move.
        // Set the actor's speed.mod = -speed.total and speed.total = 0
        thisActor.update({
          "data": {
            "conditions.dying": true,
            "conditions.unconscious": true,
            "conditions.helpless": true,
            "conditions.prone": isProne,
            // "speed.mod": -speed.total,
            // "speed.total": 0,
          }
        });
      } else {
        thisActor.update({
          "data": {
            "conditions.dying": true,
          }
        });
      }
    }
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
  }
}

/**
 * Display token Health overlay.
 *
 * @returns {Promise<void>}
 */
const displayOverlay = async (isDamage, isTargeted = false) => {
  tokenHealthDisplayed = true;

  const buttons = {
    heal: {
      icon: "<i class='fas fa-plus-circle'></i>",
      label: `${i18n('TOKEN_HEALTH.Heal')}  <kbd>⮐</kbd>`,
      callback: html => applyDamage(html, isDamage, isTargeted),
      condition: !isDamage,
    },
    damage: {
      icon: "<i class='fas fa-minus-circle'></i>",
      label: `${i18n('TOKEN_HEALTH.Damage')}  <kbd>⮐</kbd>`,
      callback: html => applyDamage(html, isDamage, isTargeted),
      condition: isDamage,
    },
  };

  let dialogTitle = `TOKEN_HEALTH.Dialog_${isDamage ? 'Damage' : 'Heal'}_Title${
    isTargeted ? '_targeted' : ''
  }`;

  const tokens = isTargeted ? Array.from(game.user.targets) : canvas.tokens.controlled
  const nameOfTokens = tokens.map(t => t.name).sort((a, b) => a.length - b.length).join(', ')
  // we will show the first four thumbnails, with the 4th cut in half and gradually
  // more and more translucent
  let thumbnails = tokens.slice(0, 4).map((t, idx) => ({ image: t.data.img, opacity: (1 - 0.15 * idx) }))
  
  let allowPenetratingDamage = false;
  let helpText = `${i18n('TOKEN_HEALTH.Dialog_Help')}`
  let defaultSubtype = "wound";
  if (game.system.id === "age-system") {
    allowPenetratingDamage = true;
    helpText = [helpText, `${i18n('TOKEN_HEALTH.Dialog_Penetration_Help')}`].join('  ')
  }
  // Determine if damage mitigation is configured
  /*
  const mit1 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_1);
  const mit2 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_2);
  const mit3 = getProperty(data, CONFIG.MITIGATION_ATTRIBUTE_3);
  if ((mit1 != undefined) || (mit2 != undefined || (mit3 != undefined) {
    allowMittigation = true;
  }*/
  
  const content = await renderTemplate(
    `modules/token-health/templates/token-health.hbs`,
    { thumbnails, allowPenetratingDamage, helpText, defaultSubtype },
  );

  // Render the dialog
  dialog = new TokenHealthDialog({
    title: i18n(dialogTitle).replace('$1', nameOfTokens),
    buttons,
    content,
    default: isDamage ? 'damage' : 'heal',
    close: () => {
      timer = setTimeout(() => {
        tokenHealthDisplayed = false;
      }, DELAY);
    },
  }).render(true);
};


Handlebars.registerHelper('isChecked', function(value, test) {
  if (value == undefined) return '';
  return value==test ? 'checked' : '';
});

/**
 * Force closing dialog on Escape (FVTT denies that if you focus something)
 */
const onEscape = () => {
  if (dialog && tokenHealthDisplayed) {
    dialog.close();
  }
};

/**
 * Open the dialog on ToggleKey
 */
const toggle = (event, key, isDamage = true, isTarget = false) => {
  event.preventDefault();

  // Make sure to call only once.
  keyboard._handled.add(key);

  // Don't display if no tokens are controlled. Don't display as well if we were trying
  // to apply damage to targets
  if (
    !tokenHealthDisplayed &&
    canvas.tokens.controlled.length > 0 &&
    !isTarget
  ) {
    displayOverlay(isDamage).catch(console.error);
  }
  // Don't display if no tokens are targeted and we were trying to attack selected
  if (!tokenHealthDisplayed && game.user.targets.size > 0 && isTarget) {
    displayOverlay(isDamage, isTarget).catch(console.error);
  }
};

/**
 * Handle custom keys not handled by FVTT
 *
 * @param {KeyboardEvent} event The keyboard event
 * @param {string} key The pressed key
 * @param {Boolean} up Is the button up
 */
const handleKeys = function (event, key, up) {
  if (up || this.hasFocus) return;

  // Base key is pressed.
  const toggleKeyBase = KeyBinding.parse(CONFIG.TOGGLE_KEY_BASE);
  if (KeyBinding.eventIsForBinding(event, toggleKeyBase)) toggle(event, key);

  // Alt key is pressed.
  const toggleKeyAlt = KeyBinding.parse(CONFIG.TOGGLE_KEY_ALT);
  if (KeyBinding.eventIsForBinding(event, toggleKeyAlt))
    toggle(event, key, false);

  // Targeting key is pressed
  const toggleKeyTarget = KeyBinding.parse(CONFIG.TOGGLE_KEY_TARGET);
  if (KeyBinding.eventIsForBinding(event, toggleKeyTarget))
    toggle(event, key, true, true);

  // Alt Targeting key is pressed
  const toggleKeyTargetAlt = KeyBinding.parse(CONFIG.TOGGLE_KEY_TARGET_ALT);
  if (KeyBinding.eventIsForBinding(event, toggleKeyTargetAlt))
    toggle(event, key, false, true);
};

/**
 * Initialize our stuff
 */
Hooks.once('ready', () => {
  // Extend _handleKeys method with our own function
  const cached_handleKeys = keyboard._handleKeys;
  keyboard._handleKeys = function () {
    handleKeys.call(this, ...arguments);
    cached_handleKeys.call(this, ...arguments);
  };

  // Extend _onEscape method with our own function
  const cached_onEscape = keyboard._onEscape;
  keyboard._onEscape = function () {
    onEscape.call(this, ...arguments);
    cached_onEscape.call(this, ...arguments);
  };

  // Initialize settings
  settings();

  // Use Azzurite settings-extender
  KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
});
