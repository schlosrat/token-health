import { i18n } from './ui.js';
import { hotkeys } from '../lib-df-hotkeys/lib-df-hotkeys.shim.js';

const MODULE_NAME = 'token-health';

export const TH_CONFIG = {};
const DEFAULT = {
  /*
  TOGGLE_KEY_BASE: {
    key: hotkeys.keys.Enter,
    alt: false,
    ctrl: false,
    shift: false
    },
  TOGGLE_KEY_ALT: {
    key: hotkeys.keys.Enter,
    alt: false,
    ctrl: false,
    shift: true
    },
  TOGGLE_KEY_TARGET: {
    key: hotkeys.keys.Enter,
    alt: true,
    ctrl: false,
    shift: false
    },
  TOGGLE_KEY_TARGET_ALT: {
    key: hotkeys.keys.Enter,
    alt: true,
    ctrl: false,
    shift: true
    },
  */
  DAMAGE_TYPE_1: '',
  DAMAGE_TYPE_2: '',
  DAMAGE_TYPE_3: '',
  DAMAGE_SUBTYPE_1: '',
  HITPOINTS_ATTRIBUTE_1: '',
  MAX_HITPOINTS_ATTRIBUTE_1: '',
  TEMP_HITPOINTS_ATTRIBUTE_1: '',
  DAMAGE_SUBTYPE_2: '',
  HITPOINTS_ATTRIBUTE_2: '',
  MAX_HITPOINTS_ATTRIBUTE_2: '',
  TEMP_HITPOINTS_ATTRIBUTE_2: '',
  MITIGATION_ATTRIBUTE_1: '',
  MITIGATION_ATTRIBUTE_2: '',
  MITIGATION_ATTRIBUTE_3: '',
  KO_THRESHOLD: 0,
  DEATH_THRESHOLD: 0,
  ALLOW_NEGATIVE: false,
  ALLOW_TEMP: false,
  ALLOW_DAMAGE_BUYOFF: false,
  ENABLE_TOKEN_CHAT: true,
  ENABLE_TOKEN_IMAGES: true,
  ENABLE_CONDITIONS: false,
  ADDITIVE_DAMAGE: false,
};

/**
 * Set all default settings, based on game system
 */
const setDefaults = () => {
  // Default to system values
  if (game.system.id === 'dnd5e' || game.system.id === 'pf1' || game.system.id === 'pf2e') {
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.max';
    DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.temp';
  } else if (game.system.id === 'swade'){
    DEFAULT.DAMAGE_SUBTYPE_1 = 'Wounds',
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'wounds.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'wounds.max';
    DEFAULT.DAMAGE_SUBTYPE_2 = 'Fatigue',
    DEFAULT.HITPOINTS_ATTRIBUTE_2 = 'fatigue.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2 = 'fatigue.max';
    DEFAULT.ADDITIVE_DAMAGE = true;
  } else if (game.system.id === 'l5r5e'){
    DEFAULT.DAMAGE_SUBTYPE_1 = 'Strife',
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'strife.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'strife.max';
    DEFAULT.DAMAGE_SUBTYPE_2 = 'Fatigue',
    DEFAULT.HITPOINTS_ATTRIBUTE_2 = 'fatigue.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2 = 'fatigue.max';
    DEFAULT.ADDITIVE_DAMAGE = true;
  } else if (game.system.id === 'torgeternity'){
    DEFAULT.DAMAGE_SUBTYPE_1 = 'Wounds',
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'wounds.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'wounds.max';
    DEFAULT.DAMAGE_SUBTYPE_2 = 'Shock',
    DEFAULT.HITPOINTS_ATTRIBUTE_2 = 'shock.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2 = 'shock.max';
    DEFAULT.ADDITIVE_DAMAGE = true;
  } else if (game.system.id === 'age-system') {
    DEFAULT.DAMAGE_TYPE_1 = 'Impact',
    DEFAULT.DAMAGE_TYPE_2 = 'Ballistic',
    DEFAULT.DAMAGE_TYPE_3 = 'Penetrating',
    DEFAULT.DAMAGE_SUBTYPE_1 = 'Wound',
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'health.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'health.max';
    DEFAULT.DAMAGE_SUBTYPE_2 = 'Stun',
    DEFAULT.HITPOINTS_ATTRIBUTE_2 = 'health.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2 = 'health.max';
    DEFAULT.MITIGATION_ATTRIBUTE_1 = 'armor.toughness.total';
    DEFAULT.MITIGATION_ATTRIBUTE_2 = 'armor.impact';
    DEFAULT.MITIGATION_ATTRIBUTE_3 = 'armor.ballistic';
    DEFAULT.ENABLE_CONDITIONS = true;
    DEFAULT.ALLOW_DAMAGE_BUYOFF = false;
  } else {
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'health.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'health.max';
  }
};

/**
 * Sets the settings or returns the current value.
 *
 * @param key
 * @param setting
 * @returns {*}
 */
const initSetting = (key, setting) => {
  let TH_CONFIG;

  try {
    TH_CONFIG = game.settings.get(MODULE_NAME, key);
    console.log(key)
    console.log(TH_CONFIG)
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register(MODULE_NAME, key, setting);
      TH_CONFIG = game.settings.get(MODULE_NAME, key);
      console.log(key)
      console.log(TH_CONFIG)
    } else {
      throw e;
    }
  }

  return TH_CONFIG;
};

//KEYBIND SETTINGS
/*
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
*/

/**
 * Register settings
 */

export default () => {
  setDefaults();

  /*************** TOKEN HEALTH HOTKEY SETTINGS ***************/
  // Hotkey defalt for applying damage to selected token(s) 
  TH_CONFIG.TOGGLE_KEY_BASE = initSetting('toggleKey', {
    name: i18n('TOKEN_HEALTH.toggleKeyName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyHint'),
    // type: KeyBinding,
    // default: DEFAULT.TOGGLE_KEY_BASE,
    default: {
      key: hotkeys.keys.Enter,
      alt: false,
      ctrl: false,
      shift: false
    },
    scope: 'user',
    TH_CONFIG: false,
    onChange: key => {
      TH_CONFIG.TOGGLE_KEY_BASE = key;
    },
  });
  // Hotkey defalt for applying healing to selected token(s) 
  TH_CONFIG.TOGGLE_KEY_ALT = initSetting('toggleKeyAlt', {
    name: i18n('TOKEN_HEALTH.toggleKeyAltName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyAltHint'),
    // type: KeyBinding,
    // default: DEFAULT.TOGGLE_KEY_ALT,
    default: {
      key: hotkeys.keys.Enter,
      alt: false,
      ctrl: false,
      shift: true
    },
    scope: 'user',
    TH_CONFIG: false,
    onChange: key => {
      TH_CONFIG.TOGGLE_KEY_ALT = key;
    },
  });
  // Hotkey defalt for applying damage to targeted token(s) 
  TH_CONFIG.TOGGLE_KEY_TARGET = initSetting('toggleKeyTarget', {
    name: i18n('TOKEN_HEALTH.toggleKeyTargetName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyTargetHint'),
    // type: KeyBinding,
    // default: DEFAULT.TOGGLE_KEY_TARGET,
    default: {
      key: hotkeys.keys.Enter,
      alt: true,
      ctrl: false,
      shift: false
    },
    scope: 'user',
    TH_CONFIG: false,
    onChange: key => {
      TH_CONFIG.TOGGLE_KEY_TARGET = key;
    },
  });
  // Hotkey defalt for applying healing to targeted token(s) 
  TH_CONFIG.TOGGLE_KEY_TARGET_ALT = initSetting('toggleKeyTargetAlt', {
    name: i18n('TOKEN_HEALTH.toggleKeyTargetAltName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyTargetAltHint'),
    default: {
      key: hotkeys.keys.Enter,
      alt: true,
      ctrl: false,
      shift: true
    },
    scope: 'user',
    TH_CONFIG: false,
    onChange: key => {
      TH_CONFIG.TOGGLE_KEY_TARGET_ALT = key;
    },
  });

  /*************** TOKEN HEALTH TH_CONFIGURATION SETTINGS ***************/
  // Enable/disable display of token thumbnail images in dialog box
  TH_CONFIG.ENABLE_TOKEN_IMAGES = initSetting('enableTokenImages', {
    name: i18n('TOKEN_HEALTH.enableTokenImages'),
    hint: i18n('TOKEN_HEALTH.enableTokenImagesHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_IMAGES,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ENABLE_TOKEN_IMAGES = key;
    },
  });
  // Enable/disable Additive Damage (for systems like SWADE, L5R5E, and TORG)
  TH_CONFIG.ADDITIVE_DAMAGE = initSetting('damageAdds', {
    name: i18n('TOKEN_HEALTH.damageAdds'),
    hint: i18n('TOKEN_HEALTH.damageAddsHint'),
    type: Boolean,
    default: DEFAULT.ADDITIVE_DAMAGE,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ADDITIVE_DAMAGE = key;
    },
  });
  // Primary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_1 = initSetting('damageType1', {
    name: i18n('TOKEN_HEALTH.damageType1'),
    hint: i18n('TOKEN_HEALTH.damageType1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_TYPE_1 = key;
    },
  });
  // Secondary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_2 = initSetting('damageType2', {
    name: i18n('TOKEN_HEALTH.damageType2'),
    hint: i18n('TOKEN_HEALTH.damageType2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_TYPE_2 = key;
    },
  });
  // Tertiary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_3 = initSetting('damageType3', {
    name: i18n('TOKEN_HEALTH.damageType3'),
    hint: i18n('TOKEN_HEALTH.damageType3Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_3,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_TYPE_3 = key;
    },
  });
  // Primary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_1 = initSetting('mitigationSource1', {
    name: i18n('TOKEN_HEALTH.mitigation1'),
    hint: i18n('TOKEN_HEALTH.mitigation1Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MITIGATION_ATTRIBUTE_1 = key;
    },
  });
  // Secondary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_2 = initSetting('mitigationSource2', {
    name: i18n('TOKEN_HEALTH.mitigation2'),
    hint: i18n('TOKEN_HEALTH.mitigation2Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MITIGATION_ATTRIBUTE_2 = key;
    },
  });
  // Tertiary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_3 = initSetting('mitigationSource3', {
    name: i18n('TOKEN_HEALTH.mitigation3'),
    hint: i18n('TOKEN_HEALTH.mitigation3Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_3,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MITIGATION_ATTRIBUTE_3 = key;
    },
  });
  // Primary damage subtype (required)
  TH_CONFIG.DAMAGE_SUBTYPE_1 = initSetting('damageSubtype1', {
    name: i18n('TOKEN_HEALTH.damageSubtype1'),
    hint: i18n('TOKEN_HEALTH.damageSubtype1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_SUBTYPE_1 = key;
    },
  });
  // Attribute recording current health (required)
  TH_CONFIG.HITPOINTS_ATTRIBUTE_1 = initSetting('hpSource1', {
    name: i18n('TOKEN_HEALTH.hp1'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  // Attribute recording max possible health (required)
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1 = initSetting('hpSourceMax1', {
    name: i18n('TOKEN_HEALTH.hpMax1'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  // Attribute for recording/tracking temporary health (optional)
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1 = initSetting('tempHpSource1', {
    name: i18n('TOKEN_HEALTH.tempHp1'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  // Secondary damage type (optional)
  TH_CONFIG.DAMAGE_SUBTYPE_2 = initSetting('damageSubtype2', {
    name: i18n('TOKEN_HEALTH.damageSubtype2'),
    hint: i18n('TOKEN_HEALTH.damageSubtype2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_SUBTYPE_2 = key;
    },
  });
  // Attribute recording current health (optional)
  TH_CONFIG.HITPOINTS_ATTRIBUTE_2 = initSetting('hpSource2', {
    name: i18n('TOKEN_HEALTH.hp2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  // Attribute recording max possible health (optional)
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2 = initSetting('hpSourceMax2', {
    name: i18n('TOKEN_HEALTH.hpMax2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  // Attribute for recording/tracking temporary health (optional)
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2 = initSetting('tempHpSource2', {
    name: i18n('TOKEN_HEALTH.tempHp2'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  // Enable/Disable allowing health to go negative
  TH_CONFIG.ALLOW_NEGATIVE = initSetting('allowNegative', {
    name: i18n('TOKEN_HEALTH.allowNegative'),
    hint: i18n('TOKEN_HEALTH.allowNegativeHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_NEGATIVE,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ALLOW_NEGATIVE = key;
    },
  });
  // Health threshold for unconsciousness (not applicable for Additivie Damage systems)
  TH_CONFIG.KO_THRESHOLD = initSetting('koThreshold', {
    name: i18n('TOKEN_HEALTH.koThreshold'),
    hint: i18n('TOKEN_HEALTH.koThresholdHint'),
    type: Number,
    default: DEFAULT.KO_THRESHOLD,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.KO_THRESHOLD = key;
    },
  });
  // Health threshold for dying (not applicable for Additivie Damage systems)
  TH_CONFIG.DEATH_THRESHOLD = initSetting('deathThreshold', {
    name: i18n('TOKEN_HEALTH.deathThreshold'),
    hint: i18n('TOKEN_HEALTH.deathThresholdHint'),
    type: Number,
    default: DEFAULT.DEATH_THRESHOLD,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DEATH_THRESHOLD = key;
    },
  });
  // Enable/Disable Setting Condition s (AGE System Specific)
  TH_CONFIG.ENABLE_CONDITIONS = initSetting('enableConditions', {
    name: i18n('TOKEN_HEALTH.enableConditions'),
    hint: i18n('TOKEN_HEALTH.enableConditionsHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_CONDITIONS,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ENABLE_CONDITIONS = key;
    },
  });
  // Permit Buyoff of Damage (AGE System Specific)
  TH_CONFIG.ALLOW_DAMAGE_BUYOFF = initSetting('allowDamageBuyoff', {
    name: i18n('TOKEN_HEALTH.allowDamageBuyoff'),
    hint: i18n('TOKEN_HEALTH.allowDamageBuyoffHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_DAMAGE_BUYOFF,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ALLOW_DAMAGE_BUYOFF = key;
    },
  });
  // Enable/Disable token chat messages
  TH_CONFIG.ENABLE_TOKEN_CHAT = initSetting('enableChat', {
    name: i18n('TOKEN_HEALTH.enableTokenChat'),
    hint: i18n('TOKEN_HEALTH.enableTokenChatHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_CHAT,
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.ENABLE_TOKEN_CHAT = key;
    },
  });
  // token chat if takeing damage (Players & GM)
  TH_CONFIG.OUCH = initSetting('ouch', {
    name: i18n('TOKEN_HEALTH.harmName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ouch"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.OUCH = key;
    },
  });
  // token chat if takeing 1 point of damage (GM Only)
  TH_CONFIG.DAMAGE_POINT = initSetting('damagePoint', {
    name: i18n('TOKEN_HEALTH.minorDamageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoint"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_POINT = key;
    },
  });
  // token chat if takeing >1 points of damage (GM Only)
  TH_CONFIG.DAMAGE_POINTS = initSetting('damagePoints', {
    name: i18n('TOKEN_HEALTH.damageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoints"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DAMAGE_POINTS = key;
    },
  });
  // token chat if damage results in unconscious
  TH_CONFIG.UNCONSCIOUS = initSetting('unconscious', {
    name: i18n('TOKEN_HEALTH.whenUnconcious'),
    hint: i18n('TOKEN_HEALTH.whenUnconciousHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.unconscious"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.UNCONSCIOUS = key;
    },
  });
  // token chat if damage results in death
  TH_CONFIG.DYING = initSetting('dying', {
    name: i18n('TOKEN_HEALTH.whenDying'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dying"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DYING = key;
    },
  });
  // token chat if you apply damage to the dead
  TH_CONFIG.DEAD = initSetting('dead', {
    name: i18n('TOKEN_HEALTH.whenDead'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dead"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.DEAD = key;
    },
  });
  // token chat if taking healing (Players & GM)
  TH_CONFIG.TY = initSetting('ty', {
    name: i18n('TOKEN_HEALTH.healName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ty"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.TY = key;
    },
  });
  // token chat if takeing 1 point of healing (GM Only)
  TH_CONFIG.HEALING_POINT = initSetting('healingPoint', {
    name: i18n('TOKEN_HEALTH.minorHealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoint"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.HEALING_POINT = key;
    },
  });
  // token chat if takeing > 1 points of healing (GM Only)
  TH_CONFIG.HEALING_POINTS = initSetting('healingPoints', {
    name: i18n('TOKEN_HEALTH.HealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoints"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.HEALING_POINTS = key;
    },
  });
  // token chat if no damage or healing taken (all was mitigated/none needed)
  TH_CONFIG.MEH = initSetting('meh', {
    name: i18n('TOKEN_HEALTH.noEffectName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.meh"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.MEH = key;
    },
  });
  // token chat if taking the injured condition (AGE-System Specific)
  TH_CONFIG.INJURED = initSetting('injured', {
    name: i18n('TOKEN_HEALTH.whenInjured'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.injured"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.INJURED = key;
    },
  });
  // token chat if taking the wonded condition (AGE-System Specific)
  TH_CONFIG.WOUNDED = initSetting('wounded', {
    name: i18n('TOKEN_HEALTH.whenWounded'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.wounded"),
    scope: 'world',
    TH_CONFIG: true,
    onChange: key => {
      TH_CONFIG.WOUNDED = key;
    },
  });
};

// let CONFIG.TokenHealth = TH_CONFIG;
// export CONFIG;
