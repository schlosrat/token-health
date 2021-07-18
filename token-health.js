// @ts-check

import { hotkeys } from '../lib-df-hotkeys/lib-df-hotkeys.shim.js';
import MODULE_NAME, { TH_CONFIG } from './settings.js';
import { registerSettings } from './settings.js';
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
 * Remove a condition (AGE System dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 */
 const removeCondition = async (thisActor, condId) => {
  /* THIS IS THE EXAMPLE TO REMOVE A CONDITION - async function */
  // This example remove condition Active Effects - AGE System code will take care of checked/unchecked boxes and token statuses  let remove = [];
  // let actor = game.actors.getName("asdf"); // replace by your function to select the actor
  // const condId = "freefalling"; // replace this by the function to select which condition you want to delete
  let remove = [];
  thisActor.effects.map(e => { /* this loop will capture all Active Effects causing the 'freefalling' condition and delete all of them. My code forsees only 1 installment of each Condition, but I am here on the safe side */
    const isCondition = (e.data.flags?.["age-system"]?.type === "conditions") ? true : false;
    const isId = (e.data.flags?.["age-system"]?.name === condId) ? true : false;
    if (isCondition && isId) remove.push(e.data._id);
  });
  await thisActor.deleteEmbeddedDocuments("ActiveEffect", remove);
}

/**
 * Apply a condition (AGE System Dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 * @returns {actor} thisActor
 */
const applyCondition = async (thisActor, condId) => {
  /* THIS IS THE EXAMPLE TO ADD A CONDITION */
  // let actor = game.actors.getName("asdf"); // replace by your function to select the actor
  // const condId = "prone"; // replace by you method to select the condition
  const condArr = thisActor.effects.filter(e => (e.data.flags?.["age-system"]?.type === "conditions") && (e.data.flags?.["age-system"]?.name === condId)); // creates and array with the active effects with the condId
  if (condArr.length < 1) { // if the array is empty, creates a new Active Effect
    const newEffect = CONFIG.statusEffects.filter(e => e.flags?.["age-system"]?.name === condId)[0]; // search for condId inside statusEffects array
    newEffect["flags.core.statusId"] = newEffect.id; // this is not really necessary, but I opted to keep like this so all Active Effects generated for conditions (no matter how they are generated) will have the same set of flags
    return thisActor.createEmbeddedDocuments("ActiveEffect", [newEffect]);
  }
  // return Promise.all(promises);
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
  // AGE-System games and allow for different damage types of
  //   Impact (mitigated by any armor type and toughness)
  //   Ballisitic (only mitigated by ballistic armor and toughness)
  //   Penetraiting (bypasses all armor and toughness)
  let damageType = "normal";
  // AGE-System games allow for two damage subtypes
  //   Wound (may actually kill the character)
  //   Stun (may at most render the character unconscious)
  let damageSubtype = "wound";

  if (TH_CONFIG.DAMAGE_TYPE_1) {
    damageType = html.find('[name="damageType"]')[0].value;
  }
  let type1;
  let type2;
  if (TH_CONFIG.DAMAGE_SUBTYPE_1) {
    type1 = html.find('[name="damageSubtype"]')[0].checked;
    type2 = html.find('[name="damageSubtype"]')[1].checked;
    if (type1) {
      damageSubtype = TH_CONFIG.DAMAGE_SUBTYPE_1.toLowerCase();
    } else {
      damageSubtype = TH_CONFIG.DAMAGE_SUBTYPE_2.toLowerCase();
    }
  }

  // Get the control paramater for enabling/disabling token chat
  let enableChat = TH_CONFIG.ENABLE_TOKEN_CHAT;

  // Get the control parameter for enablibng/disabling the application of token condtions
  let enableConditions = TH_CONFIG.ENABLE_CONDITIONS;
  // Temporary setting to prevent issues in 0.8.6
  // enableConditions = false;

  // Get the thresholds for Unconscious and Death/Dying
  let koThreshold    = TH_CONFIG.KO_THREASHOLD;
  let deathThreshold = TH_CONFIG.DEATH_THREASHOLD;
  if (koThreshold === undefined) koThreshold = 0;
  if (deathThreshold === undefined) deathThreshold = 0;
  if (!Number.isInteger(koThreshold)) koThreshold = Math.round(koThreshold);
  if (!Number.isInteger(deathThreshold)) deathThreshold = Math.round(deathThreshold);
  if (!TH_CONFIG.ALLOW_NEGATIVE) {
    if (koThreshold != undefined){
      if (koThreshold < 0) koThreshold = 0;
    }
    if (deathThreshold < 0) deathThreshold = 0;
  }

  // This controls if damage buyoff is allowed (injured/wounded/dying)
  // verses going straight to dying when health gets to 0.
  const allowDamageBuyoff = TH_CONFIG.ALLOW_DAMAGE_BUYOFF;

  const tokens = isTargeted
    ? Array.from(game.user.targets)
    : canvas.tokens.controlled;


  // Get the control parameter for treating damage as additive (escalating from a base of 0, vs. reducing from the pool of health available)
  const dAdd = TH_CONFIG.ADDITIVE_DAMAGE;
  let df = 1;
  if (dAdd) df = -1;

  // SDR: It would be nice to add an async to this arrow function...
  const promises = tokens.map(async ({actor}) => {
    // Get the actor data structure
    const data = actor.data.data;
    // Assume damageSubtype == type 1 and populate health values based on this

    let hpSource = TH_CONFIG.HITPOINTS_ATTRIBUTE_1;
    let maxSource = TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1;
    let altMaxSource = TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_1;
    let tempSource = TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1; // Handle temp hp if any

    // If damageSubtype is type 2, then overwrite with the health values for that damage type
    if (type2) {
      hpSource = TH_CONFIG.HITPOINTS_ATTRIBUTE_2;
      maxSource = TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2;
      altMaxSource = TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_2;
      tempSource = TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2; // Handle temp hp if any
    }

    // Get the health, max-health, and temp-health for this damage subtype
    const hp = getProperty(data, hpSource);
    let max = getProperty(data, maxSource);
    const altMax = getProperty(data, altMaxSource)
    if (altMax != undefined) {
      max += altMax;
    }
    const temp = getProperty(data, tempSource);

    if (dAdd) {
      koThreshold = max; // In an additive damage system koThreshold = max health for this damage type
      deathThreshold = max; // In an additive damage system deathThreshold = max health for this damage type
    }

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
    if (damageType != "Penetrating") {
      // Get the mitigation attributed
      mit1 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_1);
      mit2 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_2);
      mit3 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_3);

      // Mitigation is only applied to damange, and not healing
      if (damage > 0) {
        if (mit1 != undefined) {
          mit = mit + mit1;
        }
        if ((mit2 != undefined) && (damageType === "Impact")) { // AGE-System specific! Make general?
          mit = mit + mit2;
        }
        if ((mit3 != undefined) && (damageType === "Ballistic")) { // AGE-System specific! Make General?
          mit = mit + mit3;
        }
        dapplied = Math.max(damage - mit, 0);
      }
    }

    let anounceGM = '';
    let anouncePlayer = '';
    if (dapplied > 1) { // multiple points of damage applied
      anouncePlayer = TH_CONFIG.OUCH;
      anounceGM = dapplied + " " + TH_CONFIG.DAMAGE_POINTS + " (" + damageSubtype + ")";
    }
    if (dapplied === 1) { // One point of damage applied
      anouncePlayer = TH_CONFIG.OUCH;
      anounceGM = TH_CONFIG.DAMAGE_POINT + " (" + damageSubtype + ")";
    }
    if (dapplied === 0) { // No effective damage applied
      anouncePlayer = TH_CONFIG.MEH;
      anounceGM = anouncePlayer;
    }
    if (dapplied < 0) { // Healing applied (negative damage is healing)
      anouncePlayer = TH_CONFIG.TY;
      // Compute healing capacity
      let healingCapacity = 0;
      if (dAdd) {
        healingCapacity = hp; // hp is really the amount of damage taken
      } else {
        healingCapacity = max - hp; // damage is the difference between max and hp
      }
      if ((dapplied === -1) || (healingCapacity === 1)) {
        anounceGM = TH_CONFIG.HEALING_POINT + " (" + damageSubtype + ")";
      } else if ((dapplied < -1) && (healingCapacity > 1)) {
        anounceGM = Math.min(-dapplied, healingCapacity) + " " + TH_CONFIG.HEALING_POINTS + " (" + damageSubtype + ")";
      } else {
        anouncePlayer = TH_CONFIG.MEH;
        anounceGM = anouncePlayer;
      }
    }

    if (enableChat) {
      ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
      ChatMessage.create({content: anounceGM, speaker: ChatMessage.getSpeaker({actor: actor}),
        whisper: ChatMessage.getWhisperRecipients("GM")});
    }
    const [newHP, newTempHP] = getNewHP(hp, max, temp, df*dapplied, {
      allowNegative: TH_CONFIG.ALLOW_NEGATIVE,
    });

    // Deal with all cases that could result in Injured/Wounded/Dying conditions
    let damageCapacity = 0;
    if (dAdd) {
      damageCapacity = deathThreshold - hp;
    } else {
      damageCapacity = hp - deathThreshold;
    }

    if (damageSubtype == "stun") {
      if (dapplied >= damageCapacity) {
        // Set KO State
        isUnconscious = true;
        actor.setFlag("world", "unconscious", isUnconscious);
        // Announce KO State
        anouncePlayer = TH_CONFIG.UNCONSCIOUS;
        if (enableChat) ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
      }
    } else {
      if (dapplied > damageCapacity) {
        if (allowDamageBuyoff) {
          // call ageDamageBuyoff to handle any excess damage
          ageDamageBuyoff(actor, dapplied - damageCapacity);
        } else {
          // They're going down!
          ageNoDamageBuyoff(actor, dapplied - damageCapacity);
        }
      } else if (dapplied >= damageCapacity) {
        // Set KO State
        isUnconscious = true;
        actor.setFlag("world", "unconscious", isUnconscious);
        // Announce KO State
        anouncePlayer = TH_CONFIG.UNCONSCIOUS;
        if (enableChat) ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
      }
    }

    // If healing was applied
    if (dapplied < 0) {
      if (dAdd) {
        // If charcater was unconcious and this raises HP above koThreshold
        if (newHP > koThreshold && isUnconscious) isUnconscious = false;
        // If charcater was dying and this raises HP above deathThreshold
        if (newHP > deathThreshold && isDying) isDying = false;
      } else {
        // If charcater was unconcious and this lowers HP below koThreshold
        if (newHP < koThreshold && isUnconscious) isUnconscious = false;
        // If charcater was dying and this lowers HP below deathThreshold
        if (newHP < deathThreshold && isDying) isDying = false;
      }
      if (!TH_CONFIG.ALLOW_DAMAGE_BUYOFF && !isDying && !isUnconscious) {
        isInjured = false;
        isWounded = false;
      }

      // Update flags and conditions]
      actor.setFlag("world", "injured", isInjured);
      actor.setFlag("world", "wounded", isWounded);
      actor.setFlag("world", "unconscious", isUnconscious);
      actor.setFlag("world", "dying", isDying);
      if (game.system.id === 'age-system') {
        if (enableConditions) { // Control automatic vs. manual setting of conditions
          //   await actor.update({
          //   "data": {
          //     "conditions.dying": false,
          //     "conditions.helpless": false,
          //     "conditions.unconscious": false,
          //   }
          // });
          // actor.handleConditions("dying", false);
          // actor.handleConditions("helpless", false);
          // actor.handleConditions("unconscious", false);
          removeCondition(actor, "dying");
          removeCondition(actor, "helpless");
          removeCondition(actor, "unconscious");
        }
      }
    } else {
      if (game.system.id === 'age-system') {
        if (enableConditions) { // Control automatic vs. manual setting of conditions
          // await actor.update({
          //   "data": {
          //     "conditions.helpless": isUnconscious,
          //     "conditions.unconscious": isUnconscious,
          //   }
          // });
          // actor.handleConditions("helpless", isUnconscious);
          // actor.handleConditions("unconscious", isUnconscious);
          if (isUnconscious) {
            applyCondition(actor, "helpless");
            applyCondition(actor, "unconscious")
          } else {
            removeCondition(actor, "helpless");
            removeCondition(actor, "unconscious");
          }
        }
      }
    }

    let updates = {}
    if (temp != undefined) {
      updates = {
        _id: actor.id,
        isToken: actor.isToken,
        [`data.${hpSource || 'attributes.hp.value'}`]: newHP,
        [`data.${tempSource || 'attributes.hp.temp'}`]: newTempHP,
      };
    } else {
      updates = {
        _id: actor.id,
        isToken: actor.isToken,
        [`data.${hpSource || 'attributes.hp.value'}`]: newHP,
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
  let flavor1 = TH_CONFIG.INJURED;
  let flavor2 = TH_CONFIG.WOUNDED;
  let flavor3 = TH_CONFIG.DYING;
  let flavor4 = TH_CONFIG.DEAD;
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

  // Get the control paramater for enabling/disabling token chat
  let enableChat = TH_CONFIG.ENABLE_TOKEN_CHAT;

  // Get the control parameter for enablibng/disabling the application of token condtions
  let enableConditions = TH_CONFIG.ENABLE_CONDITIONS;
  // Temporary setting to prevent issues in 0.8.6
  // enableConditions = false;

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
      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the dying condition
        // Dying characters are also unconscious, and helpless
        // Helpless characters can't move.
        // Set the actor's speed.mod = -speed.total and speed.total = 0
        // await thisActor.update({
        //   "data": {
        //     "conditions.dying": true,
        //     "conditions.unconscious": true,
        //     "conditions.helpless": true,
        //     "conditions.prone": isProne,
        //   }
        // });
        // thisActor.handleConditions("dying", true);
        // thisActor.handleConditions("unconscious", true);
        // thisActor.handleConditions("helpless", true);
        // thisActor.handleConditions("prone", isProne);
        applyCondition(thisActor, "dying");
        applyCondition(thisActor, "unconscious");
        applyCondition(thisActor, "helpless");
        if (isProne) applyCondition(thisActor, "prone");
        else removeCondition(thisActor, "prone");
      }
    }
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
  } else if (isInjured) { // Damage being applied to a injured character
    // Set the wounded state flag
    isWounded = true;
    thisActor.setFlag("world", "wounded", isWounded);

    // Buy off 1d6 damage when taking the wounded condition
    let roll1 = new Roll("1d6").roll();
    // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
    // evaluation options to nominate your preferred behavior.

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

      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the wounded condition
        // await thisActor.update({
        //   "data": {
        //     "conditions.wounded": true,
        //     "conditions.exhausted": isExhausted,
        //     "conditions.helpless": isHelpless,
        //   }
        // });
        // thisActor.handleConditions("wounded", true);
        // thisActor.handleConditions("exhausted", isExhausted);
        // thisActor.handleConditions("helpless", isHelpless);
        applyCondition(thisActor, "wounded");
        if (isExhausted) applyCondition(thisActor, "exhausted");
        else removeCondition(thisActor, "exhausted");
        if (isHelpless) applyCondition(thisActor, "helpless");
        else removeCondition(thisActor, "helpless");
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
        if (enableConditions) { // Control automatic vs. manual setting of conditions
          // Set the dying condition
          // Dying characters are also unconscious, and helpless
          // Helpless characters can't move.
          // Set the actor's speed.mod = -speed.total and speed.total = 0
          // await thisActor.update({
          //   "data": {
          //     "conditions.dying": true,
          //     "conditions.unconscious": true,
          //     "conditions.helpless": true,
          //     "conditions.prone": isProne,
          //   }
          // });
          // thisActor.handleConditions("dying", true);
          // thisActor.handleConditions("unconscious", true);
          // thisActor.handleConditions("helpless", true);
          // thisActor.handleConditions("prone", isProne);
          applyCondition(thisActor, "dying");
          applyCondition(thisActor, "unconscious");
          applyCondition(thisActor, "helpless");
          if (isProne) applyCondition(thisActor, "prone");
          else removeCondition(thisActor, "prone");
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
    // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
    // evaluation options to nominate your preferred behavior.

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

      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the conditions
        // await thisActor.update({
        //   "data": {
        //     "conditions.injured": true,
        //     "conditions.fatigued": isFatigued,
        //     "conditions.exhausted": isExhausted,
        //     "conditions.helpless": isHelpless,
        //   }
        // });
        // thisActor.handleConditions("injured", true);
        // thisActor.handleConditions("fatigued", isFatigued);
        // thisActor.handleConditions("exhausted", isExhausted);
        // thisActor.handleConditions("helpless", isHelpless);
        applyCondition(thisActor, "injured");
        if (isFatigued) applyCondition(thisActor, "fatigued");
        else removeCondition(thisActor, "fatigued");
        if (isExhausted) applyCondition(thisActor, "exhausted");
        else removeCondition(thisActor, "exhausted");
        if (isProne) applyCondition(thisActor, "helpless");
        else removeCondition(thisActor, "helpless");
    }
    }

    if (roll1._total < dRemaining) {
      // Set the wounded state flag
      isWounded = true;
      thisActor.setFlag("world", "wounded", isWounded);

      // Buy off 1d6 damage when taking the wounded condition
      let roll2 = new Roll("1d6").roll();
    // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
    // evaluation options to nominate your preferred behavior.

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

        if (enableConditions) { // Control automatic vs. manual setting of conditions
          // Set the conditions
          // await thisActor.update({
          //   "data": {
          //     "conditions.wounded": true,
          //     "conditions.exhausted": isExhausted,
          //     "conditions.helpless": isHelpless,
          //   }
          // });
          // thisActor.handleConditions("wounded", true);
          // thisActor.handleConditions("exhausted", isExhausted);
          // thisActor.handleConditions("helpless", isHelpless);
          applyCondition(thisActor, "wounded");
          if (isExhausted) applyCondition(thisActor, "exhausted");
          else removeCondition(thisActor, "exhausted");
          if (isHelpless) applyCondition(thisActor, "helpless");
          else removeCondition(thisActor, "helpless");
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
          if (enableConditions) { // Control automatic vs. manual setting of conditions
            // Set the dying condition
            // Dying characters are also unconscious, and helpless
            // Helpless characters can't move.
            // Set the actor's speed.mod = -speed.total and speed.total = 0
            // await thisActor.update({
            //   "data": {
            //     "conditions.dying": true,
            //     "conditions.unconscious": true,
            //     "conditions.helpless": true,
            //     "conditions.prone": isProne,
            //   }
            // });
            // thisActor.handleConditions("dying", true);
            // thisActor.handleConditions("unconscious", true);
            // thisActor.handleConditions("helpless", true);
            // thisActor.handleConditions("prone", isProne);
            applyCondition(thisActor, "dying");
            applyCondition(thisActor, "unconscious");
            applyCondition(thisActor, "helpless");
            if (isProne) applyCondition(thisActor, "prone");
            else removeCondition(thisActor, "prone");
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
  // let flavor1 = TH_CONFIG.INJURED;
  // let flavor2 = TH_CONFIG.WOUNDED;
  let flavor3 = TH_CONFIG.DYING;
  let flavor4 = TH_CONFIG.DEAD;
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

  // Get the control paramater for enabling/disabling token chat
  let enableChat = TH_CONFIG.ENABLE_TOKEN_CHAT;

  // Get the control paramater for enabling/disabling token chat
  let enableConditions = TH_CONFIG.ENABLE_CONDITIONS;
  // Temporary setting to prevent issues in 0.8.6
  // enableConditions = false;

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
      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the dying condition
        // Dying characters are also unconscious, and helpless
        // Helpless characters can't move.
        // Set the actor's speed.mod = -speed.total and speed.total = 0
        // await thisActor.update({
        //   "data": {
        //     "conditions.dying": true,
        //     "conditions.unconscious": true,
        //     "conditions.helpless": true,
        //     "conditions.prone": isProne,
        //     // "speed.mod": -speed.total,
        //     // "speed.total": 0,
        //   }
        // });
        // thisActor.handleConditions("dying", true);
        // thisActor.handleConditions("unconscious", true);
        // thisActor.handleConditions("helpless", true);
        // thisActor.handleConditions("prone", isProne);
        applyCondition(thisActor, "dying");
        applyCondition(thisActor, "unconscious");
        applyCondition(thisActor, "helpless");
        if (isProne) applyCondition(thisActor, "prone");
        else removeCondition(thisActor, "prone");
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

  let thumbnails = {}
  if (TH_CONFIG.ENABLE_TOKEN_IMAGES){
    // Show first four thumbnails (4th cut in half) with gradually decreasing opacity
    thumbnails = tokens.slice(0, 4).map((t, idx) => ({ image: t.data.img, opacity: (1 - 0.15 * idx) }))
  }
  // let allowPenetratingDamage = false;
  let helpText = `${i18n('TOKEN_HEALTH.Dialog_Help')}`
  let damageType1 = TH_CONFIG.DAMAGE_TYPE_1;
  let damageType2 = TH_CONFIG.DAMAGE_TYPE_2;
  let damageType3 = TH_CONFIG.DAMAGE_TYPE_3;
  let damageTypes = [];
  if (damageType1.length > 0) damageTypes.push(damageType1);
  if (damageType2.length > 0) damageTypes.push(damageType2);
  if (damageType3.length > 0) damageTypes.push(damageType3);
  // console.log(damageType1, damageType2, damageType3, damageTypes)
  // let damageTypes = [TH_CONFIG.DAMAGE_TYPE_1, TH_CONFIG.DAMAGE_TYPE_2, TH_CONFIG.DAMAGE_TYPE_3];
  let damageSubtype1 = TH_CONFIG.DAMAGE_SUBTYPE_1;
  let damageSubtype2 = TH_CONFIG.DAMAGE_SUBTYPE_2;
  let damageSubtypes = [];
  if (damageSubtype1.length > 0) damageSubtypes.push(damageSubtype1);
  if (damageSubtype2.length > 0) damageSubtypes.push(damageSubtype2);
  // console.log(damageSubtype1, damageSubtype2, damageSubtypes)
  // let defaultSubtype = TH_CONFIG.DAMAGE_SUBTYPE_1; // "wound";
  // console.log(defaultSubtype)
  if (game.system.id === "age-system") {
    // allowPenetratingDamage = true;
    helpText = [helpText, `${i18n('TOKEN_HEALTH.Dialog_Penetration_Help')}`].join('  ')
  }
  // Determine if damage mitigation is Configured
  /*
  const mit1 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_1);
  const mit2 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_2);
  const mit3 = getProperty(data, TH_CONFIG.MITIGATION_ATTRIBUTE_3);
  if ((mit1 != undefined) || (mit2 != undefined || (mit3 != undefined) {
    allowMittigation = true;
  }*/

  if (TH_CONFIG.ENABLE_TOKEN_IMAGES){
    const content = await renderTemplate(
      `modules/token-health/templates/token-health-images.hbs`,
      {thumbnails, damageTypes, damageSubtypes, helpText},
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
  } else {
    const content = await renderTemplate(
      `modules/token-health/templates/token-health.hbs`,
      {damageTypes, damageSubtypes, helpText},
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
  }
};


Handlebars.registerHelper('isChecked', function(value, test) {
  // console.log(value)
  // console.log(test)
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
// SDR (Old Way): const toggle = (event, key, isDamage = true, isTarget = false) => {
const toggle = (event, isDamage = true, isTarget = false) => {
  event.preventDefault();

  // Make sure to call only once.
  // SDR: BROKE BROKE BROKE keyboard._handled.add(key);

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
/* SDR: OBSOLETE! Fold functionality into use of DF HotKeys
const handleKeys = function (event, key, up) {
  if (up || this.hasFocus) return;

  // Base key is pressed.
  const toggleKeyBase = KeyBinding.parse(TH_CONFIG.TOGGLE_KEY_BASE);
  if (KeyBinding.eventIsForBinding(event, toggleKeyBase)) toggle(event, key);

  // Alt key is pressed.
  const toggleKeyAlt = KeyBinding.parse(TH_CONFIG.TOGGLE_KEY_ALT);
  if (KeyBinding.eventIsForBinding(event, toggleKeyAlt))
    toggle(event, key, false);

  // Targeting key is pressed
  const toggleKeyTarget = KeyBinding.parse(TH_CONFIG.TOGGLE_KEY_TARGET);
  if (KeyBinding.eventIsForBinding(event, toggleKeyTarget))
    toggle(event, key, true, true);

  // Alt Targeting key is pressed
  const toggleKeyTargetAlt = KeyBinding.parse(TH_CONFIG.TOGGLE_KEY_TARGET_ALT);
  if (KeyBinding.eventIsForBinding(event, toggleKeyTargetAlt))
    toggle(event, key, false, true);
};
*/

/**
 * Initialize our stuff
 */
// Make sure lib-df-hotkeys is installed and active
Hooks.once('ready', async () => {
	if (!game.modules.get('lib-df-hotkeys')?.active) {
		console.error('Missing lib-df-hotkeys module dependency');
		if (game.user.isGM)
			ui.notifications.error("'Token Health' requires the 'Library: DF Hotkeys' module. Please install and activate this dependency.");
		// Perform alternative code to handle missing library
		return;
	}
	// Perform your Hotkey registrations

  // Initialize settings
  // settings();
  // Register custom module settings
  registerSettings();

  CONFIG.TokenHealth = TH_CONFIG;

  // console.log(TH_CONFIG)
  // console.log(CONFIG)


  // CONFIG.TokenHealth.ENABLE_TOKEN_IMAGES = TH_CONFIG.ENABLE_TOKEN_IMAGES; // game.settings.get(MODULE_NAME, 'enableTokenImages');
  // CONFIG.TokenHealth.ADDITIVE_DAMAGE = game.settings.get(MODULE_NAME, 'damageAdds');
  // CONFIG.TokenHealth.DAMAGE_TYPE_1 = game.settings.get(MODULE_NAME, 'damageType1');
  // CONFIG.TokenHealth.DAMAGE_TYPE_2 = game.settings.get(MODULE_NAME, 'damageType2');
  // CONFIG.TokenHealth.DAMAGE_TYPE_3 = game.settings.get(MODULE_NAME, 'damageType3');
  // CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'mitigationSource1');
  // CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'mitigationSource2');
  // CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_3 = game.settings.get(MODULE_NAME, 'mitigationSource3');
  // CONFIG.TokenHealth.DAMAGE_SUBTYPE_1 = game.settings.get(MODULE_NAME, 'damageSubtype1');
  // CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'hpSource1');
  // CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'hpSourceMax1');
  // CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'tempHpSource1');
  // CONFIG.TokenHealth.DAMAGE_SUBTYPE_2 = game.settings.get(MODULE_NAME, 'damageSubtype2');
  // CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'hpSource2');
  // CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'hpSourceMax2');
  // CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'tempHpSource2');
  // CONFIG.TokenHealth.ALLOW_NEGATIVE = game.settings.get(MODULE_NAME, 'allowNegative');
  // CONFIG.TokenHealth.KO_THRESHOLD = game.settings.get(MODULE_NAME, 'koThreshold');
  // CONFIG.TokenHealth.DEATH_THRESHOLD = game.settings.get(MODULE_NAME, 'deathThreshold');
  // CONFIG.TokenHealth.ENABLE_CONDITIONS = game.settings.get(MODULE_NAME, 'enableConditions');
  // CONFIG.TokenHealth.ALLOW_DAMAGE_BUYOFF = game.settings.get(MODULE_NAME, 'allowDamageBuyoff');
  // CONFIG.TokenHealth.ENABLE_TOKEN_CHAT = game.settings.get(MODULE_NAME, 'enableChat');
  // CONFIG.TokenHealth.OUCH = game.settings.get(MODULE_NAME, 'ouch');
  // CONFIG.TokenHealth.DAMAGE_POINT = game.settings.get(MODULE_NAME, 'damagePoint');
  // CONFIG.TokenHealth.DAMAGE_POINTS = game.settings.get(MODULE_NAME, 'damagePoints');
  // CONFIG.TokenHealth.UNCONSCIOUS = game.settings.get(MODULE_NAME, 'unconscious');
  // CONFIG.TokenHealth.DYING = game.settings.get(MODULE_NAME, 'dying');
  // CONFIG.TokenHealth.DEAD = game.settings.get(MODULE_NAME, 'dead');
  // CONFIG.TokenHealth.TY = game.settings.get(MODULE_NAME, 'ty');
  // CONFIG.TokenHealth.HEALING_POINT = game.settings.get(MODULE_NAME, 'healingPoint');
  // CONFIG.TokenHealth.HEALING_POINTS = game.settings.get(MODULE_NAME, 'healingPoints');
  // CONFIG.TokenHealth.MEH = game.settings.get(MODULE_NAME, 'meh');
  // CONFIG.TokenHealth.INJURED = game.settings.get(MODULE_NAME, 'injured');
  // CONFIG.TokenHealth.WOUNDED = game.settings.get(MODULE_NAME, 'wounded');

  // console.log(TH_CONFIG)
  // console.log(CONFIG)

  /* SDR: Obsolete with change to DF Hotkeys
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
  */

  // Use Azzurite settings-extender
  // KeyBinding = window.Azzu.SettingsTypes.KeyBinding;
});

Hooks.once('init', async function() {
  /* Hotkeys.registerGroup(group: HotkeyGroup, throwOnError?: boolean): boolean */
  hotkeys.registerGroup({
    name: 'token-health.token-health',
    label: 'Token Health', // Translate this? i18n('TOKEN_HEALTH.toggleKeyName')
    description: 'Allows you to Configure and override the keybindings for Token Health' // <-- Optional
  }, false);

  // TOGGLE_KEY_BASE: 'Enter'
  /* Hotkeys.registerShortcut(TH_CONFIG: HotkeySetting, throwOnError?: boolean) */
  try {
    game.settings.get('token-health', 'toggleKey');
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register("token-health", "toggleKey", {
        scope: 'user',
        TH_CONFIG: false,
        default: {
            key: hotkeys.keys.Enter,
            alt: false,
            ctrl: false,
            shift: false
        }
      });
    } else {
      throw e;
    }
  }
  hotkeys.registerShortcut({
		name: 'token-health.toggleKey',
		label: i18n('TOKEN_HEALTH.toggleKeyName'),
		group: 'token-health.token-health',
		get: () => game.settings.get('token-health', 'toggleKey'),
		set: async value => await game.settings.set('token-health', 'toggleKey', value),
		default: () => { return { key: hotkeys.keys.Enter, alt: false, ctrl: false, shift: false }; },
		onKeyDown: self => {
      // Replace this with the code DF Hotkey should execute when the hot key is pressed
      // console.log('Token Health: Base key pressed!');
      toggle(event);
      // SDR: This is all wrong - but an example of what custom Hotbar does
      // if (game.settings.get("custom-hotbar","chbDisabled") !== true) {
      //   CHBDebug('Custom Hotbar | Fire custom hotbar macro slot 1!');
      //   const num = 1;
      //   const slot = ui.customHotbar.macros.find(m => m.key === num);
      //   if ( ui.customHotbar.macros[num] ) slot.macro.execute();
      // }
    }
	});

  // TOGGLE_KEY_ALT: 'Shift + Enter'
  try {
    game.settings.get('token-health', 'toggleKeyAlt');
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register("token-health", "toggleKeyAlt", {
        scope: 'user',
        TH_CONFIG: false,
        default: {
            key: hotkeys.keys.Enter,
            alt: false,
            ctrl: false,
            shift: true
        }
      });
    } else {
      throw e;
    }
  }
  hotkeys.registerShortcut({
		name: 'token-health.toggleKeyAlt',
		label: i18n('TOKEN_HEALTH.toggleKeyAltName'),
		group: 'token-health.token-health',
		get: () => game.settings.get('token-health', 'toggleKeyAlt'),
		set: async value => await game.settings.set('token-health', 'toggleKeyAlt', value),
		default: () => { return { key: hotkeys.keys.Enter, alt: false, ctrl: false, shift: true }; },
		onKeyDown: self => {
      // Replace this with the code DF Hotkey should execute when the hot key is pressed
      // console.log('Token Health: Alt key pressed!');
      toggle(event, false);
      // SDR: This is all wrong - but an example of what custom Hotbar does
      // if (game.settings.get("custom-hotbar","chbDisabled") !== true) {
      //   CHBDebug('Custom Hotbar | Fire custom hotbar macro slot 1!');
      //   const num = 1;
      //   const slot = ui.customHotbar.macros.find(m => m.key === num);
      //   if ( ui.customHotbar.macros[num] ) slot.macro.execute();
      // }
    }
	});

  // TOGGLE_KEY_TARGET: 'Alt + Enter'
  try {
    game.settings.get('token-health', 'toggleKeyTarget');
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register("token-health", "toggleKeyTarget", {
        scope: 'user',
        TH_CONFIG: false,
        default: {
            key: hotkeys.keys.Enter,
            alt: true,
            ctrl: false,
            shift: false
        }
      });
    } else {
      throw e;
    }
  }
  hotkeys.registerShortcut({
		name: 'token-health.toggleKeyTarget',
		label: i18n('TOKEN_HEALTH.toggleKeyTargetName'),
		group: 'token-health.token-health',
		get: () => game.settings.get('token-health', 'toggleKeyTarget'),
		set: async value => await game.settings.set('token-health', 'toggleKeyTarget', value),
		default: () => { return { key: hotkeys.keys.Enter, alt: true, ctrl: false, shift: false }; },
		onKeyDown: self => {
      // Replace this with the code DF Hotkey should execute when the hot key is pressed
      // console.log('Token Health: Target key pressed!');
      toggle(event, true, true);
      // SDR: This is all wrong - but an example of what custom Hotbar does
      // if (game.settings.get("custom-hotbar","chbDisabled") !== true) {
      //   CHBDebug('Custom Hotbar | Fire custom hotbar macro slot 1!');
      //   const num = 1;
      //   const slot = ui.customHotbar.macros.find(m => m.key === num);
      //   if ( ui.customHotbar.macros[num] ) slot.macro.execute();
      // }
    }
	});

  // TOGGLE_KEY_TARGET_ALT: 'Alt + Shift + Enter'
  try {
    game.settings.get('token-health', 'toggleKeyTargetAlt');
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register("token-health", "toggleKeyTargetAlt", {
        scope: 'user',
        TH_CONFIG: false,
        default: {
            key: hotkeys.keys.Enter,
            alt: true,
            ctrl: false,
            shift: true
        }
      });
    } else {
      throw e;
    }
  }
  hotkeys.registerShortcut({
		name: 'token-health.toggleKeyTargetAlt',
		label: i18n('TOKEN_HEALTH.toggleKeyTargetAltName'),
		group: 'token-health.token-health',
		get: () => game.settings.get('token-health', 'toggleKeyTargetAlt'),
		set: async value => await game.settings.set('token-health', 'toggleKeyTargetAlt', value),
		default: () => { return { key: hotkeys.keys.Enter, alt: true, ctrl: false, shift: true }; },
		onKeyDown: self => {
      // Replace this with the code DF Hotkey should execute when the hot key is pressed
      // console.log('Token Health: Target Alt key pressed!');
      toggle(event, false, true);
      // SDR: This is all wrong - but an example of what custom Hotbar does
      // if (game.settings.get("custom-hotbar","chbDisabled") !== true) {
      //   CHBDebug('Custom Hotbar | Fire custom hotbar macro slot 1!');
      //   const num = 1;
      //   const slot = ui.customHotbar.macros.find(m => m.key === num);
      //   if ( ui.customHotbar.macros[num] ) slot.macro.execute();
      // }
    }
	});

});
