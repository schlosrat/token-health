// @ts-check

import { MODULE_NAME, TH_CONFIG } from './settings.js';
import { registerSettings } from './settings.js';
import {i18n} from './ui.js';
import getNewHP from './getNewHP.js';

const DELAY = 400;

let tokenHealthDisplayed = false;
let dialog, timer;
//let KeyBinding;

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
 * Check a condition (AGE System dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 * @returns {boolean} condStatus
 */
  // async function checkCondition(thisActor, condId) {
  const checkCondition = async (thisActor, condId) => {
  // Check the Token Health relevant condition for this actor and return boolean to indicate status

  let condStatus = false;

  // Behavior depends on system
  if (game.system.id === 'age-system') {
    // Token Health relevant conditions are maintained in age-system as Active Effects

    // console.log(thisToken);
    // console.log(thisActor);

    // thisActor.effects.map(e => {
    thisActor.effects.map(e => {
      /* This loop will find all Active Effects causing the condId condition.
      AGE System code forsees only 1 installment of each Condition, but we do it this way on the safe side */
      // console.log(e);
      // V9: const isCondition = (e.data.flags?.["age-system"]?.isCondition) ? true : false;
      // V9: const isId = (e.data.flags?.core?.statusId === condId) ? true : false;
      const isCondition = (e.flags?.["age-system"]?.isCondition) ? true : false;
      const isId = (e.flags?.core?.statusId === condId) ? true : false;
      if (isCondition && isId) condStatus = true
    });
  } else {
    // For all other systems Token Health conditions are maintained as world-readable flags within the actor

    // Make sure we've got a flag for this condition, get it if we do
    if (thisActor.getFlag("world", condId) === undefined) {
      // If the flag isn't present then set it to false
      thisActor.setFlag("world", condId, condStatus);
    } else {
      condStatus = thisActor.getFlag("world", condId);
    }
  }
  return condStatus;
}


/**
 * Remove a condition (AGE System dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 */
  const removeCondition = async (thisActor, condId) => {
  // Clear a Token Health relevant condition for this actor

  // Behavior depends on system
  if (game.system.id === 'age-system') {
    // Token Health relevant conditions are maintained in age-system as Active Effects

    let remove = [];
    // thisActor.effects.map(e => {
    thisActor.effects.map(e => { // vkdolea changed this line
      /* This loop will capture all Active Effects causing the condId condition and delete all of them.
      AGE System code forsees only 1 installment of each Condition, but we do it this way on the safe side */
      // V9: const isCondition = (e.data.flags?.["age-system"]?.isCondition) ? true : false;
      // V9: const isId = (e.data.flags?.core?.statusId === condId) ? true : false;
      const isCondition = (e.flags?.["age-system"]?.isCondition) ? true : false;
      const isId = (e.flags?.core?.statusId === condId) ? true : false;
      if (isCondition && isId) remove.push(e._id);
    });
    await thisActor.deleteEmbeddedDocuments("ActiveEffect", remove); // vkdolea changed this line
  } else {
    // For all other systems Token Health conditions are maintained as world-readable flags for the actor

    // Set this condition to false (this also creates the flag if needed)
    thisActor.setFlag("world", condId, false); 
  }
}

/**
 * Apply a condition (AGE System Dependent)
 * 
 * @param {actor} thisActor
 * @param {string} condId
 * @returns {actor} thisActor
 */
const applyCondition = async (thisActor, condId) => {
  // Set the Token Health relevant condition for this actor

  // Behavior depends on system
  if (game.system.id === 'age-system') {
    // For AGE System, Token Health relevant conditions are maintained as Active Effects

    // let thisActor = game.actors.get(thisToken.document.actorId);
    // console.log(thisToken);
    // console.log(thisActor);
    // V9: const condArr = thisActor.effects.filter(e => (e.data.flags?.["age-system"]?.isCondition) &&
    //       (e.data.flags?.core?.statusId === condId)); // creates an array with the active effects with the condId
    const condArr = thisActor.effects.filter(e => (e.flags?.["age-system"]?.isCondition) &&
      (e.flags?.core?.statusId === condId)); // creates an array with the active effects with the condId
    if (condArr.length < 1) { // if the array is empty, creates a new Active Effect
      const newEffect = CONFIG.statusEffects.filter(e => e.id === condId)[0]; // search for condId inside statusEffects array
      newEffect["flags.core.statusId"] = newEffect.id; // this is not really necessary, but I opted to keep like this so all Active Effects generated for conditions (no matter how they are generated) will have the same set of flags
      return thisActor.createEmbeddedDocuments("ActiveEffect", [newEffect]);
    }
  } else {
    // For all other systems Token Health conditions are maintained as world-readable flags for the actor

    // Set this condition to true (this also creates the flag if needed)
    thisActor.setFlag("world", condId, true);
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

  // Get the control parameter for enablibng/disabling the application of actor condtions
  let enableConditions = false;
  if (game.system.id === 'age-system') {
    if (game.settings.get("age-system", "inUseConditions") === 'expanse') {
      enableConditions = TH_CONFIG.ENABLE_CONDITIONS;
    }
  }

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
    // console.log(actor)
    if (actor.isOwner === false) {
      // console.log("You're not worthy!")
      return;
    }
    // Get the actor data structure
    // V9: const data = actor.data.data;
    const data = actor.system; // is the AGE System only or all systems in V10?
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

    // Conditions are applied to tokens, not actors
    isInjured     = await checkCondition(actor, "injured");
    isWounded     = await checkCondition(actor, "wounded");
    isUnconscious = await checkCondition(actor, "unconscious");
    isDying       = await checkCondition(actor, "dying");

    // console.log("applyDamage: Initial conditions:");
    // console.log("isDying = ", isDying);
    // console.log("isUnconscious = ", isUnconscious);
    // console.log("isWounded = ", isWounded);
    // console.log("isInjured = ", isInjured);

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
    if (dapplied > 0) { // Damage will be done
      // Compute damage capacity
      let damageCapacity = 0;
      if (dAdd) {
        damageCapacity = max - hp; // Max damage is the difference between max and hp
      } else {
        damageCapacity = hp;       // Max damage is eual to hp
      }
      // Compute net effect (healing can't take the token above their max capacity)
      let netEffect = Math.min(dapplied, damageCapacity);

      if (dapplied > 1) { // multiple points of damage applied
        anouncePlayer = TH_CONFIG.OUCH.replace('$DS', damageSubtype).replace('$D', dapplied).replace('$NE', netEffect);
        // anounceGM = dapplied + " " + TH_CONFIG.DAMAGE_POINTS + " (" + damageSubtype + ")";
        anounceGM = TH_CONFIG.DAMAGE_POINTS.replace('$DS', damageSubtype).replace('$D', damage).replace('$NE', netEffect);
      }
      if (dapplied === 1) { // One point of damage applied
        anouncePlayer = TH_CONFIG.OUCH.replace('$DS', damageSubtype).replace('$D', dapplied).replace('$NE', netEffect);
        // anounceGM = TH_CONFIG.DAMAGE_POINT + " (" + damageSubtype + ")";
        anounceGM = TH_CONFIG.DAMAGE_POINT.replace('$DS', damageSubtype).replace('$D', damage).replace('$NE', netEffect);
      }
    }
    if (dapplied === 0) { // No effective damage or healing applied
      anouncePlayer = TH_CONFIG.MEH;
      anounceGM = anouncePlayer;
    }
    if (dapplied < 0) { // Healing applied (negative damage done is healing)
      // Compute healing capacity
      let healingCapacity = 0;
      if (dAdd) {
        healingCapacity = hp;       // Max healing is the current hp
      } else {
        healingCapacity = max - hp; // Max healing is the difference between max and hp
      }
      // Compute net effect (healing can't take the token above their max capacity)
      let netEffect = Math.min(-dapplied, healingCapacity);
      anouncePlayer = TH_CONFIG.TY.replace('$DS', damageSubtype).replace('$D', -dapplied).replace('$NE', netEffect);
      if ((dapplied === -1) || (healingCapacity === 1)) {
        // anounceGM = TH_CONFIG.HEALING_POINT + " (" + damageSubtype + ")";
        anounceGM = TH_CONFIG.HEALING_POINT.replace('$DS', damageSubtype).replace('$D', -dapplied).replace('$NE', netEffect);
      } else if ((dapplied < -1) && (healingCapacity > 1)) {
        // anounceGM = Math.min(-dapplied, healingCapacity) + " " + TH_CONFIG.HEALING_POINTS + " (" + damageSubtype + ")";
        anounceGM = TH_CONFIG.HEALING_POINTS.replace('$DS', damageSubtype).replace('$D', -dapplied).replace('$NE', netEffect);
      } else {
        anouncePlayer = TH_CONFIG.MEH;
        anounceGM = anouncePlayer;
      }
    }

    if (enableChat) {
      // console.log(ChatMessage)
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
        // actor.setFlag("world", "unconscious", isUnconscious);
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
        if (allowDamageBuyoff) {
          // Nothing to do!
        } else {
          // Set KO State
          isUnconscious = true;
          // actor.setFlag("world", "unconscious", isUnconscious);
          // Announce KO State
          anouncePlayer = TH_CONFIG.UNCONSCIOUS;
          if (enableChat) ChatMessage.create({content: anouncePlayer, speaker: ChatMessage.getSpeaker({actor: actor})});
        }
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
      // actor.setFlag("world", "injured", isInjured);
      // actor.setFlag("world", "wounded", isWounded);
      // actor.setFlag("world", "unconscious", isUnconscious);
      // actor.setFlag("world", "dying", isDying);

      if (enableConditions) { // Control automatic vs. manual setting of conditions
        await removeCondition(actor, "dying");
        await removeCondition(actor, "helpless");
        await removeCondition(actor, "unconscious");
      }
    } else {
      if (enableConditions) { // Control automatic vs. manual setting of conditions
        if (isUnconscious) {
          await applyCondition(actor, "helpless");
          await applyCondition(actor, "unconscious")
        } else {
          await removeCondition(actor, "helpless");
          await removeCondition(actor, "unconscious");
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
    // tidx++
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

  // let thisActor = game.actors.get(thisToken.document.actorId);
  // Get the control paramater for enabling/disabling token chat
  let enableChat = TH_CONFIG.ENABLE_TOKEN_CHAT;

  // Get the control parameter for enablibng/disabling the application of token condtions
  let enableConditions = TH_CONFIG.ENABLE_CONDITIONS;
  // Temporary setting to prevent issues in 0.8.6
  // enableConditions = false;

  if (game.system.id === 'age-system') {
    // V9: conditions = thisActor .data.data.conditions;
    // V9: abilities = thisActor .data.data.abilities;
    abilities = thisActor .system.abilities;
    // V9: speed = thisActor .data.data.speed;
    // V9: origin = thisActor .data.data.ancestry;
    origin = thisActor .system.ancestry;

    // Get the AGE-specific conditions and attributes needed
    // This allows other mods and macros to override this mod
    isFatigued    = await checkCondition(thisActor, "fatigued");
    isExhausted   = await checkCondition(thisActor, "exhausted");
    isInjured     = await checkCondition(thisActor, "injured");
    isWounded     = await checkCondition(thisActor, "wounded");
    isUnconscious = await checkCondition(thisActor, "unconscious");
    isDying       = await checkCondition(thisActor, "dying");
    isProne       = await checkCondition(thisActor, "prone");
    isFreefalling = await checkCondition(thisActor, "freefalling");
    isHelpless    = await checkCondition(thisActor, "helpless");

    // console.log("ageDamageBuyoff: Initial conditions:")
    // console.log("isFatigued = ",    isFatigued)
    // console.log("isExhausted = ",   isExhausted)
    // console.log("isInjured = ",     isInjured)
    // console.log("isWounded = ",     isWounded)
    // console.log("isUnconscious = ", isUnconscious)
    // console.log("isDying = ",       isDying)
    // console.log("isProne = ",       isProne)
    // console.log("isFreefalling = ", isFreefalling)
    // console.log("isHelpless = ",    isHelpless)

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
    // thisActor.setFlag("world", "dying", isDying);

    // If not freefalling, then character will also be prone
    if (!isFreefalling) isProne = true;

    // If this is an AGE System game
    // if (game.system.id === 'age-system') {
      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the dying condition
        // Dying characters are also unconscious, and helpless
        // Helpless characters can't move.
        await applyCondition(thisActor, "dying");
        await applyCondition(thisActor, "unconscious");
        await applyCondition(thisActor, "helpless");
        if (isProne) await applyCondition(thisActor, "prone");
        else await removeCondition(thisActor, "prone");
      }
    // }
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
  } else if (isInjured) { // Damage being applied to a injured character
    // Set the wounded state flag
    isWounded = true;
    // thisActor.setFlag("world", "wounded", isWounded);

    // Buy off 1d6 damage when taking the wounded condition
    let roll1 = await new Roll("1d6").roll({async: true});
    // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
    // evaluation options to nominate your preferred behavior.

    // Announce the roll
    roll1.toMessage({speaker:{alias:this_speaker.alias}, flavor: flavor2});

    // If this is an AGE System game
    // if (game.system.id === 'age-system') {
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
        await applyCondition(thisActor, "wounded");
        if (isExhausted) await applyCondition(thisActor, "exhausted");
        else await removeCondition(thisActor, "exhausted");
        if (isHelpless) await applyCondition(thisActor, "helpless");
        else await removeCondition(thisActor, "helpless");
      }
    // }

    if (roll1._total < dRemaining) { // out of options, advance to dying
      // Set the dying state flag
      isDying = true;
      // thisActor.setFlag("world", "dying", isDying);

      // Character is wounded but has more damage to account for, so now they're dying!
      // If not freefalling, then character will also be prone
      if (!isFreefalling) isProne = true;

      // If this is an AGE System game
      if (enableConditions) { // Control automatic vs. manual setting of conditions
        // Set the dying condition
        // Dying characters are also unconscious, and helpless

        await applyCondition(thisActor, "dying");
        await applyCondition(thisActor, "unconscious");
        await applyCondition(thisActor, "helpless");
        if (isProne) await applyCondition(thisActor, "prone");
        // else await removeCondition(thisActor, "prone"); don't remove Prone - they might be that way voluntarily
        }
      if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
    }
  } else {  // Damage being applied to an uninjured character
    // Set the injured state flag
    isInjured = true;
    // thisActor.setFlag("world", "injured", isInjured);

    // Buy off 1d6 damage when taking the injured condition
    let roll1 = await new Roll("1d6").roll({async: true});
    // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
    // evaluation options to nominate your preferred behavior.

    // Announce the roll
    roll1.toMessage({speaker: {alias:this_speaker.alias}, flavor: flavor1});

    // If this is an AGE System game
    if (enableConditions) { // Control automatic vs. manual setting of conditions
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
      await applyCondition(thisActor, "injured");
      if (isFatigued) await applyCondition(thisActor, "fatigued");
      else await removeCondition(thisActor, "fatigued");
      if (isExhausted) await applyCondition(thisActor, "exhausted");
      else await removeCondition(thisActor, "exhausted");
      if (isProne) await applyCondition(thisActor, "helpless");
      else await removeCondition(thisActor, "helpless");
    }

    if (roll1._total < dRemaining) {
      // Set the wounded state flag
      isWounded = true;
      // thisActor.setFlag("world", "wounded", isWounded);

      // Buy off 1d6 damage when taking the wounded condition
      let roll2 = await new Roll("1d6").roll({async: true});
      // Roll#evaluate is becoming asynchronous. In the short term you may pass async=true or async=false to
      // evaluation options to nominate your preferred behavior.

      // Announce the roll
      roll2.toMessage({speaker: {alias:this_speaker.alias}, flavor: flavor2});

      // If this is an AGE System game
      if (enableConditions) { // Control automatic vs. manual setting of conditions
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

        await applyCondition(thisActor, "wounded");
        if (isExhausted) await applyCondition(thisActor, "exhausted");
        else await removeCondition(thisActor, "exhausted");
        if (isHelpless) await applyCondition(thisActor, "helpless");
        else await removeCondition(thisActor, "helpless");
      }
      if ((roll1._total + roll2._total) < dRemaining) {
        // Character is wounded but has more damage to account for, so now they're dying!
        // Set the dying state flag
        isDying = true;
        // thisActor.setFlag("world", "dying", isDying);

        // If not freefalling, then character will also be prone
        if (!isFreefalling) isProne = true;

        // If this is an AGE System game

        if (enableConditions) { // Control automatic vs. manual setting of conditions
          // Set the dying condition
          // Dying characters are also unconscious, and helpless

          await applyCondition(thisActor, "dying");
          await applyCondition(thisActor, "unconscious");
          await applyCondition(thisActor, "helpless");
          if (isProne) await applyCondition(thisActor, "prone");
          else await removeCondition(thisActor, "prone");
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
  // let conditions;
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

  // let thisActor = game.actors.get(thisToken.document.actorId);

  // Get the AGE-specific conditions and attributes needed
  // This allows other mods and macros to override this mod
  // isExhausted   = await checkCondition(thisActor, "exhausted");
  // isFatigued    = await checkCondition(thisActor, "fatigued");
  // isInjured     = await checkCondition(thisActor, "injured");
  // isWounded     = await checkCondition(thisActor, "wounded");
  isUnconscious = await checkCondition(thisActor, "unconscious");
  isDying       = await checkCondition(thisActor, "dying");
  isProne       = await checkCondition(thisActor, "prone");
  isFreefalling = await checkCondition(thisActor, "freefalling");
  isHelpless    = await checkCondition(thisActor, "helpless");

  /*
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
  */

  if (game.system.id === 'age-system') {
    // V9: conditions = thisActor .data.data.conditions;
    // V9: abilities = thisActor .data.data.abilities;
    abilities = thisActor .system.abilities;
    // V9: speed = thisActor .data.data.speed;
    // V9: origin = thisActor .data.data.ancestry;
    origin = thisActor .system.ancestry;

    // Get the AGE-specific conditions and attributes needed
    // This allows other mods and macros to override this mod
    // isFatigued    = await checkCondition(thisActor, "fatigued");
    // isExhausted   = await checkCondition(thisActor, "exhausted");
    // isInjured     = await checkCondition(thisActor, "injured");
    // isWounded     = await checkCondition(thisActor, "wounded");
    isUnconscious = await checkCondition(thisActor, "unconscious");
    isDying       = await checkCondition(thisActor, "dying");
    isProne       = await checkCondition(thisActor, "prone");
    isFreefalling = await checkCondition(thisActor, "freefalling");
    isHelpless    = await checkCondition(thisActor, "helpless");

    // console.log("ageNoDamageBuyoff: Initial conditions:")
    // console.log("isFatigued = ",    isFatigued)
    // console.log("isExhausted = ",   isExhausted)
    // console.log("isInjured = ",     isInjured)
    // console.log("isWounded = ",     isWounded)

    // console.log("isUnconscious = ", isUnconscious)
    // console.log("isDying = ",       isDying)
    // console.log("isProne = ",       isProne)
    // console.log("isFreefalling = ", isFreefalling)
    // console.log("isHelpless = ",    isHelpless)

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
    // thisActor.setFlag("world", "dying", isDying);

    // If this is an AGE System game
    if (enableConditions) { // Control automatic vs. manual setting of conditions
      // Set the dying condition
      // Dying characters are also unconscious, and helpless
      // Helpless characters can't move.
      await applyCondition(thisActor, "dying");
      await applyCondition(thisActor, "unconscious");
      await applyCondition(thisActor, "helpless");
      if (isProne) await applyCondition(thisActor, "prone");
      // else await removeCondition(thisActor, "prone");
    }
    if (enableChat) ChatMessage.create({speaker: this_speaker, content: flavor3}); // Good by cruel world!
  }
}

/**
 * Display token Health overlay.
 *
 * @param {boolean} isDamage Flag to determine if launching to apply damage or healing
 * @param {array} tokens An array of token obeject to affect
 * @param {boolean} isTargeted Flag to determine if launching to affect targeted vs selected
 * 
 * @returns {Promise<void>}
 */
const displayOverlay = async (isDamage, tokens, isTargeted = false) => {
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

  // const allTokens = isTargeted ? Array.from(game.user.targets) : canvas.tokens.controlled
  // var tokens = allTokens.filter((x) => { return x.isOwner === true; });
  // const tokens = isTargeted ? Array.from(game.user.targets) : canvas.tokens.controlled
  const nameOfTokens = tokens.map(t => t.name).sort((a, b) => a.length - b.length).join(', ')
  // console.log(allTokens)
  // console.log(tokens)

  // if (tokens.length < 1) return;

  let thumbnails = {}
  if (TH_CONFIG.ENABLE_TOKEN_IMAGES){
    // Show first four thumbnails (4th cut in half) with gradually decreasing opacity
    // V9: thumbnails = tokens.slice(0, 4).map((t, idx) => ({ image: t.data.img, opacity: (1 - 0.15 * idx) }))
    thumbnails = tokens.slice(0, 4).map((t, idx) => ({ image: t.document.texture.src, opacity: (1 - 0.15 * idx) }))
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

  if (!game.user.isGM && TH_CONFIG.RESTRICT_PLAYER_LAUNCH) {
    ui.notifications.info(i18n('TOKEN_HEALTH.worthyMsg'))
    // bail out here
    return;
  }

  // Cull the array of targeted/selected tokens to only include those owned by the user
  const allTokens = isTarget ? Array.from(game.user.targets) : canvas.tokens.controlled
  var tokens = allTokens.filter((x) => { return x.isOwner === true; });

  // console.log(allTokens)
  // console.log(tokens)

  // If there are no owned tokens then no need to launch the dialog
  if (tokens.length < 1) {
    ui.notifications.info(i18n('TOKEN_HEALTH.accessMsg'))
    // bail out here
    return;
  }

  // Don't display if no tokens are controlled. Don't display as well if we were trying
  // to apply damage/healing to targets
  if (!tokenHealthDisplayed && canvas.tokens.controlled.length > 0 && !isTarget) {
    displayOverlay(isDamage, tokens).catch(console.error);
  }
  // Don't display if no tokens are targeted and we were trying to affect selected
  if (!tokenHealthDisplayed && game.user.targets.size > 0 && isTarget) {
    displayOverlay(isDamage, tokens, isTarget).catch(console.error);
  }
};

/**
 * Initialize our stuff
 */
Hooks.once('ready', async () => {
  // Initialize settings
  // settings();
  // Register custom module settings
  registerSettings();

  CONFIG.TokenHealth = TH_CONFIG;

  // console.log("Hooks.once('ready')");
  // console.log(TH_CONFIG);
  // console.log("Restrict Player Launch:", TH_CONFIG.RESTRICT_PLAYER_LAUNCH);

  // Customize keybinding registrations - This needs to execute after registerSettings
  // ******* FIX FOR BUG IN V9 238 where keybinding name and hint localizations may not work *******
  // TOGGLE_KEY_BASE: 'Enter'
  let key1 = game.keybindings.actions.get("token-health.damageSelectedTokens");
  // console.log("Was damageSelectedTokens.restricted:", key1.restricted)
  key1.name = i18n('TOKEN_HEALTH.toggleKeyName');
  key1.hint = i18n('TOKEN_HEALTH.toggleKeyHint');
  // key1.restricted = TH_CONFIG.RESTRICT_PLAYER_LAUNCH;
  let key1new = game.keybindings.actions.get("token-health.damageSelectedTokens");
  // console.log("Updated damageSelectedTokens.restricted:", key1new.restricted)

  // TOGGLE_KEY_ALT: 'Shift + Enter'
  let key2 = game.keybindings.actions.get("token-health.healSelectedTokens");
  // console.log("Was healSelectedTokens.restricted:", key2.restricted)
  key2.name = i18n('TOKEN_HEALTH.toggleKeyAltName');
  key2.hint = i18n('TOKEN_HEALTH.toggleKeyAltHint');
  // key2.restricted = TH_CONFIG.RESTRICT_PLAYER_LAUNCH;
  let key2new = game.keybindings.actions.get("token-health.healSelectedTokens");
  // console.log("Updated healSelectedTokens.restricted:", key2new.restricted)

  // TOGGLE_KEY_TARGET: 'Alt + Enter'
  let key3 = game.keybindings.actions.get("token-health.damageTargetedTokens");
  // console.log("Was damageTargetedTokens.restricted:", key3.restricted)
  key3.name = i18n('TOKEN_HEALTH.toggleKeyTargetName');
  key3.hint = i18n('TOKEN_HEALTH.toggleKeyTargetHint');
  // key3.restricted = TH_CONFIG.RESTRICT_PLAYER_LAUNCH;
  let key3new = game.keybindings.actions.get("token-health.damageTargetedTokens");
  // console.log("Updated damageTargetedTokens.restricted:", key3new.restricted)

  // TOGGLE_KEY_TARGET_ALT: 'Alt + Shift + Enter'
  let key4 = game.keybindings.actions.get("token-health.healTargetedTokens");
  // console.log("Was healTargetedTokens.restricted:", key4.restricted)
  key4.name = i18n('TOKEN_HEALTH.toggleKeyTargetAltName');
  key4.hint = i18n('TOKEN_HEALTH.toggleKeyTargetAltHint');
  // key4.restricted = TH_CONFIG.RESTRICT_PLAYER_LAUNCH;
  let key4new = game.keybindings.actions.get("token-health.healTargetedTokens");
  // console.log("Updated healTargetedTokens.restricted:", key4new.restricted)
});

Hooks.once('init', async function() {
  // NEW FVTT V9 keybinding system
	// game.keybindings.register(MODULE_NAME, "sneakyDoor", {
  //   name: i18n('TOKEN_HEALTH.toggleKeyName'),
  //   hint: i18n('TOKEN_HEALTH.toggleKeyHint'),
  // editable: [
	// 	  {
	// 		key: "Enter"
	// 	  }
	// 	],
	// 	precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	// });

  // Register custom module settings
  // registerSettings();

  // CONFIG.TokenHealth = TH_CONFIG;

  // console.log("Hooks.once('init')");
  // console.log(TH_CONFIG);
  // console.log("Restrict Player Launch:", TH_CONFIG.RESTRICT_PLAYER_LAUNCH);

  // Initialize Keybindings (this executes before registerSettings, so TOKEN_HEALTH stucture is not available yet)
  // TOGGLE_KEY_BASE: 'Enter'
  game.keybindings.register(MODULE_NAME, "damageSelectedTokens", {
    // name: "Damage Selected Tokens", // TOKEN_HEALTH.toggleKeyName
    hint: "Display a dialog to enter damage for selected tokens", // TOKEN_HEALTH.toggleKeyHint
		name: i18n('TOKEN_HEALTH.toggleKeyName'),
    // hint: i18n('TOKEN_HEALTH.toggleKeyHint'),
    // uneditable: [
    //   {
    //     key: "Keyp",
    //     modifiers: [ "CONTROL" ]
    //   }
    // ],
    editable: [
      {
        key: "Enter"
      }
    ],
    //onDown: () => { ui.notifications.info("Pressed!") },
    onDown: self => {
      // Replace this with the code the keybinding should execute when pressed
      // ui.notifications.info(i18n('TOKEN_HEALTH.toggleKeyHint'));
      toggle(event);
    },
    onUp: () => {},
    restricted: false,              // Restrict this Keybinding to gamemaster only?
    // restricted: TH_CONFIG.RESTRICT_PLAYER_LAUNCH,
    // reservedModifiers: [ "ALT" ],  // If ALT is pressed, the notification is permanent instead of temporary
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  // TOGGLE_KEY_ALT: 'Shift + Enter'
  game.keybindings.register(MODULE_NAME, "healSelectedTokens", {
    // name: "Heal Selected Tokens", // TOKEN_HEALTH.toggleKeyAltName
    hint: "Display a dialog to enter healing for selected tokens", // TOKEN_HEALTH.toggleKeyAltHint
		name: i18n('TOKEN_HEALTH.toggleKeyAltName'),
    // hint: i18n('TOKEN_HEALTH.toggleKeyAltHint'),
    editable: [
      {
        key: "Enter",
        modifiers: [ "SHIFT" ]
      }
    ],
    onDown: self => {
      // Replace this with the code the keybinding should execute when pressed
      // ui.notifications.info(i18n('TOKEN_HEALTH.toggleKeyAltHint'));
      toggle(event, false);
    },
    onUp: () => {},
    restricted: false,              // Restrict this Keybinding to gamemaster only?
    // restricted: TH_CONFIG.RESTRICT_PLAYER_LAUNCH,
    // reservedModifiers: [ "ALT" ],  // If ALT is pressed, the notification is permanent instead of temporary
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  // TOGGLE_KEY_TARGET: 'Alt + Enter'
  game.keybindings.register(MODULE_NAME, "damageTargetedTokens", {
    // name: "Damage Targeted Tokens", // TOKEN_HEALTH.toggleKeyTargetName
    hint: "Display a dialog to enter damage for targeted tokens", // TOKEN_HEALTH.toggleKeyTargetHint
		name: i18n('TOKEN_HEALTH.toggleKeyTargetName'),
    // hint: i18n('TOKEN_HEALTH.toggleKeyTargetHint'),
    editable: [
      {
        key: "Enter",
        modifiers: [ "ALT" ]
      }
    ],
    onDown: self => {
      // Replace this with the code the keybinding should execute when pressed
      // ui.notifications.info(i18n('TOKEN_HEALTH.toggleKeyTargetHint'));
      toggle(event, true, true);
    },
    onUp: () => {},
    restricted: false,              // Restrict this Keybinding to gamemaster only?
    // restricted: TH_CONFIG.RESTRICT_PLAYER_LAUNCH,
    // reservedModifiers: [ "ALT" ],  // If ALT is pressed, the notification is permanent instead of temporary
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  // TOGGLE_KEY_TARGET_ALT: 'Alt + Shift + Enter'
  game.keybindings.register(MODULE_NAME, "healTargetedTokens", {
    // name: "Heal Targeted Tokens", // TOKEN_HEALTH.toggleKeyTargetAltName
    hint: "Display a dialog to enter damage for targeted tokens", // TOKEN_HEALTH.toggleKeyTargetAltHint
		name: i18n('TOKEN_HEALTH.toggleKeyTargetAltName'),
    // hint: i18n('TOKEN_HEALTH.toggleKeyTargetAltHint'),
    editable: [
      {
        key: "Enter",
        modifiers: [ "ALT", "SHIFT" ]
      }
    ],
    onDown: self => {
      // Replace this with the code the keybinding should execute when pressed
      // ui.notifications.info(i18n('TOKEN_HEALTH.toggleKeyTargetAltHint'));
      toggle(event, false, true);
    },
    onUp: () => {},
    restricted: false,              // Restrict this Keybinding to gamemaster only?
    // restricted: TH_CONFIG.RESTRICT_PLAYER_LAUNCH,
    // reservedModifiers: [ "ALT" ],  // If ALT is pressed, the notification is permanent instead of temporary
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

});
