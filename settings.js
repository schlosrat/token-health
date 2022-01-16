import { i18n } from './ui.js';

export const MODULE_NAME = 'token-health';

export const TH_CONFIG = {};

const DEFAULT = {
  DAMAGE_TYPE_1: '',
  DAMAGE_TYPE_2: '',
  DAMAGE_TYPE_3: '',
  DAMAGE_SUBTYPE_1: '',
  HITPOINTS_ATTRIBUTE_1: '',
  MAX_HITPOINTS_ATTRIBUTE_1: '',
  ALT_MAX_HITPOINTS_ATTRIBUTE_1: '',
  TEMP_HITPOINTS_ATTRIBUTE_1: '',
  DAMAGE_SUBTYPE_2: '',
  HITPOINTS_ATTRIBUTE_2: '',
  MAX_HITPOINTS_ATTRIBUTE_2: '',
  ALT_MAX_HITPOINTS_ATTRIBUTE_2: '',
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
  RESTRICT_PLAYER_LAUNCH: true,
};

/**
 * Set all default settings, based on game system
 */
const setDefaults = () => {
  // Default to system values
  if (game.system.id === 'dnd5e' || game.system.id === 'pf1' || game.system.id === 'pf2e') {
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.max';
    DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.tempmax';
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
  } else if (game.system.id === 'expanse') {
    DEFAULT.DAMAGE_TYPE_1 = 'Impact',
    DEFAULT.DAMAGE_TYPE_2 = 'Ballistic',
    DEFAULT.DAMAGE_TYPE_3 = 'Penetrating',
    DEFAULT.DAMAGE_SUBTYPE_1 = 'Wound',
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'fortune.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'fortune.max';
    DEFAULT.DAMAGE_SUBTYPE_2 = 'Stun',
    DEFAULT.HITPOINTS_ATTRIBUTE_2 = 'fortune.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2 = 'fortune.max';
    DEFAULT.MITIGATION_ATTRIBUTE_1 = 'toughness.modified';
    DEFAULT.MITIGATION_ATTRIBUTE_2 = 'armor.modified';
    DEFAULT.MITIGATION_ATTRIBUTE_3 = '';
    DEFAULT.ENABLE_CONDITIONS = false;
    DEFAULT.ALLOW_DAMAGE_BUYOFF = false;
  } else if (game.system.id === 'sfrpg') {
    DEFAULT.HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1 = 'attributes.hp.max';
    DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = 'attributes.sp.max';
    DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_1 = 'attributes.sp.value';
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
  let THCONFIG;

  try {
    THCONFIG = game.settings.get(MODULE_NAME, key);
    // console.log(key)
    // console.log(THCONFIG)
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register(MODULE_NAME, key, setting);
      THCONFIG = game.settings.get(MODULE_NAME, key);
      // console.log(key)
      // console.log(THCONFIG)
    } else {
      throw e;
    }
  }

  return THCONFIG;
};

/**
 * Register settings
 */

export const registerSettings = function () {
  setDefaults();
  CONFIG.TokenHealth = {};
 
  // Enable/disable display of token thumbnail images in dialog box
  TH_CONFIG.ENABLE_TOKEN_IMAGES = initSetting( 'enableTokenImages', {
    name: i18n('TOKEN_HEALTH.enableTokenImages'),
    hint: i18n('TOKEN_HEALTH.enableTokenImagesHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_IMAGES,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_TOKEN_IMAGES = key;
    },
  });
  CONFIG.TokenHealth.ENABLE_TOKEN_IMAGES = TH_CONFIG.ENABLE_TOKEN_IMAGES; // = game.settings.get(MODULE_NAME, 'enableTokenImages');
  // Enable/disable ability for players to launch Token Health
  TH_CONFIG.RESTRICT_PLAYER_LAUNCH = initSetting( 'restrictPlayerLaunch', {
    name: i18n('TOKEN_HEALTH.restrictPlayerLaunch'),
    hint: i18n('TOKEN_HEALTH.restrictPlayerLaunchHint'),
    type: Boolean,
    default: DEFAULT.RESTRICT_PLAYER_LAUNCH,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.RESTRICT_PLAYER_LAUNCH = key;

      // console.log("restrictPlayerLaunch.onChange")
      // TOGGLE_KEY_BASE: 'Enter'
      // let key1 = game.keybindings.actions.get("token-health.damageSelectedTokens");
      // console.log("Was damageSelectedTokens.restricted:", key1.restricted)
      // key1.restricted = key;
      // let key1new = game.keybindings.actions.get("token-health.damageSelectedTokens");
      // console.log("Updated damageSelectedTokens.restricted:", key1new.restricted)
        
      // TOGGLE_KEY_ALT: 'Shift + Enter'
      // let key2 = game.keybindings.actions.get("token-health.healSelectedTokens");
      // console.log("Was healSelectedTokens.restricted:", key2.restricted)
      // key2.restricted = key;
      // let key2new = game.keybindings.actions.get("token-health.healSelectedTokens");
      // console.log("Updated healSelectedTokens.restricted:", key2new.restricted)
        
      // TOGGLE_KEY_TARGET: 'Alt + Enter'
      // let key3 = game.keybindings.actions.get("token-health.damageTargetedTokens");
      // console.log("Was damageTargetedTokens.restricted:", key3.restricted)
      // key3.restricted = key;
      // let key3new = game.keybindings.actions.get("token-health.damageTargetedTokens");
      // console.log("Updated damageTargetedTokens.restricted:", key3new.restricted)
        
      // TOGGLE_KEY_TARGET_ALT: 'Alt + Shift + Enter'
      // let key4 = game.keybindings.actions.get("token-health.healTargetedTokens");
      // console.log("Was healTargetedTokens.restricted:", key4.restricted)
      // key4.restricted = key;
      // let key4new = game.keybindings.actions.get("token-health.healTargetedTokens");
      // console.log("Updated healTargetedTokens.restricted:", key4new.restricted)
    },
  });
  CONFIG.TokenHealth.RESTRICT_PLAYER_LAUNCH = TH_CONFIG.RESTRICT_PLAYER_LAUNCH; // = game.settings.get(MODULE_NAME, 'restrictPlayerLaunch');
  // UI warning message sent to player if they try to launch Token Health when GM has restricgted it
  TH_CONFIG.WORTHY = initSetting( 'worthy', {
    name: i18n('TOKEN_HEALTH.worthy'),
    hint: i18n('TOKEN_HEALTH.worthyHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.worthyMsg"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.worthy = key;
    },
  });
  CONFIG.TokenHealth.WORTHY = TH_CONFIG.WORTHY; // = game.settings.get(MODULE_NAME, 'worthy');
  // UI warning message sent to player if they try to launch Token Health for tokens they don't own
  TH_CONFIG.ACCESS = initSetting( 'access', {
    name: i18n('TOKEN_HEALTH.access'),
    hint: i18n('TOKEN_HEALTH.accessHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.accessMsg"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.access = key;
    },
  });
  CONFIG.TokenHealth.ACCESS = TH_CONFIG.ACCESS; // = game.settings.get(MODULE_NAME, 'access');
  // Enable/disable Additive Damage (for systems like SWADE, L5R5E, and TORG)
  TH_CONFIG.ADDITIVE_DAMAGE = initSetting( 'damageAdds', {
    name: i18n('TOKEN_HEALTH.damageAdds'),
    hint: i18n('TOKEN_HEALTH.damageAddsHint'),
    type: Boolean,
    default: DEFAULT.ADDITIVE_DAMAGE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ADDITIVE_DAMAGE = key;
    },
  });
  CONFIG.TokenHealth.ADDITIVE_DAMAGE = TH_CONFIG.ADDITIVE_DAMAGE; // = game.settings.get(MODULE_NAME, 'damageAdds');
  // Primary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_1 = initSetting( 'damageType1', {
    name: i18n('TOKEN_HEALTH.damageType1'),
    hint: i18n('TOKEN_HEALTH.damageType1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_1 = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_TYPE_1 = TH_CONFIG.DAMAGE_TYPE_1; // = game.settings.get(MODULE_NAME, 'damageType1');
  // Secondary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_2 = initSetting( 'damageType2', {
    name: i18n('TOKEN_HEALTH.damageType2'),
    hint: i18n('TOKEN_HEALTH.damageType2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_2 = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_TYPE_2 = TH_CONFIG.DAMAGE_TYPE_2; // = game.settings.get(MODULE_NAME, 'damageType2');
  // Tertiary damage type (optional)
  TH_CONFIG.DAMAGE_TYPE_3 = initSetting( 'damageType3', {
    name: i18n('TOKEN_HEALTH.damageType3'),
    hint: i18n('TOKEN_HEALTH.damageType3Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_3,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_3 = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_TYPE_3 = TH_CONFIG.DAMAGE_TYPE_3; // = game.settings.get(MODULE_NAME, 'damageType3');
  // Primary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_1 = initSetting( 'mitigationSource1', {
    name: i18n('TOKEN_HEALTH.mitigation1'),
    hint: i18n('TOKEN_HEALTH.mitigation1Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_1 = TH_CONFIG.MITIGATION_ATTRIBUTE_1; // = game.settings.get(MODULE_NAME, 'mitigationSource1');
  // Secondary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_2 = initSetting( 'mitigationSource2', {
    name: i18n('TOKEN_HEALTH.mitigation2'),
    hint: i18n('TOKEN_HEALTH.mitigation2Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_2 = TH_CONFIG.MITIGATION_ATTRIBUTE_2; // = game.settings.get(MODULE_NAME, 'mitigationSource2');
  // Tertiary damage mitigation attribute (optional)
  TH_CONFIG.MITIGATION_ATTRIBUTE_3 = initSetting( 'mitigationSource3', {
    name: i18n('TOKEN_HEALTH.mitigation3'),
    hint: i18n('TOKEN_HEALTH.mitigation3Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_3,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_3 = key;
    },
  });
  CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_3 = TH_CONFIG.MITIGATION_ATTRIBUTE_3; // = game.settings.get(MODULE_NAME, 'mitigationSource3');
  // Primary damage subtype (required)
  TH_CONFIG.DAMAGE_SUBTYPE_1 = initSetting( 'damageSubtype1', {
    name: i18n('TOKEN_HEALTH.damageSubtype1'),
    hint: i18n('TOKEN_HEALTH.damageSubtype1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_SUBTYPE_1 = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_SUBTYPE_1 = TH_CONFIG.DAMAGE_SUBTYPE_1; // = game.settings.get(MODULE_NAME, 'damageSubtype1');
  // Attribute recording current health (required)
  TH_CONFIG.HITPOINTS_ATTRIBUTE_1 = initSetting( 'hpSource1', {
    name: i18n('TOKEN_HEALTH.hp1'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_1 = TH_CONFIG.HITPOINTS_ATTRIBUTE_1; // = game.settings.get(MODULE_NAME, 'hpSource1');
  // Attribute recording max possible health (required)
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1 = initSetting( 'hpSourceMax1', {
    name: i18n('TOKEN_HEALTH.hpMax1'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_1 = TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1; // = game.settings.get(MODULE_NAME, 'hpSourceMax1');
  // Attribute recording secondary max possible health pool (optional) - *** NEW! ***
  TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = initSetting('altHpSourceMax1', {
    name: i18n('TOKEN_HEALTH.altHpMax1'),
    hint: i18n('TOKEN_HEALTH.altHpMax1Hint'),
    type: String,
    default: DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.TokenHealth.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_1; // = game.settings.get(MODULE_NAME, 'altHpSourceMax1');
  // Attribute for recording/tracking temporary health (optional)
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1 = initSetting( 'tempHpSource1', {
    name: i18n('TOKEN_HEALTH.tempHp1'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_1 = TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1; // = game.settings.get(MODULE_NAME, 'tempHpSource1');
  // Secondary damage type (optional)
  TH_CONFIG.DAMAGE_SUBTYPE_2 = initSetting( 'damageSubtype2', {
    name: i18n('TOKEN_HEALTH.damageSubtype2'),
    hint: i18n('TOKEN_HEALTH.damageSubtype2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_SUBTYPE_2 = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_SUBTYPE_2 = TH_CONFIG.DAMAGE_SUBTYPE_2; // = game.settings.get(MODULE_NAME, 'damageSubtype2');
  // Attribute recording current health (optional)
  TH_CONFIG.HITPOINTS_ATTRIBUTE_2 = initSetting ('hpSource2', {
    name: i18n('TOKEN_HEALTH.hp2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_2 = TH_CONFIG.HITPOINTS_ATTRIBUTE_2; // = game.settings.get(MODULE_NAME, 'hpSource2');
  // Attribute recording max possible health (optional)
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2 = initSetting ('hpSourceMax2', {
    name: i18n('TOKEN_HEALTH.hpMax2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_2 = TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2; // = game.settings.get(MODULE_NAME, 'hpSourceMax2');
  // Attribute recording secondary max possible health pool (optional) - *** NEW! ***
  TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_2 = initSetting('altHpSourceMax2', {
    name: i18n('TOKEN_HEALTH.altHpMax2'),
    hint: i18n('TOKEN_HEALTH.altHpMax2Hint'),
    type: String,
    default: DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALT_MAX_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.TokenHealth.ALT_MAX_HITPOINTS_ATTRIBUTE_2 = TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_2; // = game.settings.get(MODULE_NAME, 'altHpSourceMax2');
  // Attribute for recording/tracking temporary health (optional)
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2 = initSetting ('tempHpSource2', {
    name: i18n('TOKEN_HEALTH.tempHp2'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_2 = TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2; // = game.settings.get(MODULE_NAME, 'tempHpSource2');
  // Enable/Disable allowing health to go negative
  TH_CONFIG.ALLOW_NEGATIVE = initSetting ('allowNegative', {
    name: i18n('TOKEN_HEALTH.allowNegative'),
    hint: i18n('TOKEN_HEALTH.allowNegativeHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_NEGATIVE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALLOW_NEGATIVE = key;
    },
  });
  CONFIG.TokenHealth.ALLOW_NEGATIVE = TH_CONFIG.ALLOW_NEGATIVE; // = game.settings.get(MODULE_NAME, 'allowNegative');
  // Health threshold for unconsciousness (not applicable for Additivie Damage systems)
  TH_CONFIG.KO_THRESHOLD = initSetting( 'koThreshold', {
    name: i18n('TOKEN_HEALTH.koThreshold'),
    hint: i18n('TOKEN_HEALTH.koThresholdHint'),
    type: Number,
    default: DEFAULT.KO_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.KO_THRESHOLD = key;
    },
  });
  CONFIG.TokenHealth.KO_THRESHOLD = TH_CONFIG.KO_THRESHOLD; // = game.settings.get(MODULE_NAME, 'koThreshold');
  // Health threshold for dying (not applicable for Additivie Damage systems)
  TH_CONFIG.DEATH_THRESHOLD = initSetting( 'deathThreshold', {
    name: i18n('TOKEN_HEALTH.deathThreshold'),
    hint: i18n('TOKEN_HEALTH.deathThresholdHint'),
    type: Number,
    default: DEFAULT.DEATH_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DEATH_THRESHOLD = key;
    },
  });
  CONFIG.TokenHealth.DEATH_THRESHOLD = TH_CONFIG.DEATH_THRESHOLD; // = game.settings.get(MODULE_NAME, 'deathThreshold');
  // Enable/Disable Setting Condition s (AGE System Specific)
  TH_CONFIG.ENABLE_CONDITIONS = initSetting( 'enableConditions', {
    name: i18n('TOKEN_HEALTH.enableConditions'),
    hint: i18n('TOKEN_HEALTH.enableConditionsHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_CONDITIONS,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_CONDITIONS = key;
    },
  });
  CONFIG.TokenHealth.ENABLE_CONDITIONS = TH_CONFIG.ENABLE_CONDITIONS; // = game.settings.get(MODULE_NAME, 'enableConditions');
  // Permit Buyoff of Damage (AGE System Specific)
  TH_CONFIG.ALLOW_DAMAGE_BUYOFF = initSetting( 'allowDamageBuyoff', {
    name: i18n('TOKEN_HEALTH.allowDamageBuyoff'),
    hint: i18n('TOKEN_HEALTH.allowDamageBuyoffHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_DAMAGE_BUYOFF,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALLOW_DAMAGE_BUYOFF = key;
    },
  });
  CONFIG.TokenHealth.ALLOW_DAMAGE_BUYOFF = TH_CONFIG.ALLOW_DAMAGE_BUYOFF; // = game.settings.get(MODULE_NAME, 'allowDamageBuyoff');
  // Enable/Disable token chat messages
  TH_CONFIG.ENABLE_TOKEN_CHAT = initSetting( 'enableChat', {
    name: i18n('TOKEN_HEALTH.enableTokenChat'),
    hint: i18n('TOKEN_HEALTH.enableTokenChatHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_CHAT,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_TOKEN_CHAT = key;
    },
  });
  CONFIG.TokenHealth.ENABLE_TOKEN_CHAT = TH_CONFIG.ENABLE_TOKEN_CHAT; // = game.settings.get(MODULE_NAME, 'enableChat');
  // token chat if takeing damage (Players & GM)
  TH_CONFIG.OUCH = initSetting( 'ouch', {
    name: i18n('TOKEN_HEALTH.harmName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ouch"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.OUCH = key;
    },
  });
  CONFIG.TokenHealth.OUCH = TH_CONFIG.OUCH; // = game.settings.get(MODULE_NAME, 'ouch');
  // token chat if takeing 1 point of damage (GM Only)
  TH_CONFIG.DAMAGE_POINT = initSetting( 'damagePoint', {
    name: i18n('TOKEN_HEALTH.minorDamageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_POINT = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_POINT = TH_CONFIG.DAMAGE_POINT; // = game.settings.get(MODULE_NAME, 'damagePoint');
  // token chat if takeing >1 points of damage (GM Only)
  TH_CONFIG.DAMAGE_POINTS = initSetting( 'damagePoints', {
    name: i18n('TOKEN_HEALTH.damageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_POINTS = key;
    },
  });
  CONFIG.TokenHealth.DAMAGE_POINTS = TH_CONFIG.DAMAGE_POINTS; // = game.settings.get(MODULE_NAME, 'damagePoints');
  // token chat if damage results in unconscious
  TH_CONFIG.UNCONSCIOUS = initSetting( 'unconscious', {
    name: i18n('TOKEN_HEALTH.whenUnconcious'),
    hint: i18n('TOKEN_HEALTH.whenUnconciousHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.unconscious"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.UNCONSCIOUS = key;
    },
  });
  CONFIG.TokenHealth.UNCONSCIOUS = TH_CONFIG.UNCONSCIOUS; // = game.settings.get(MODULE_NAME, 'unconscious');
  // token chat if damage results in death
  TH_CONFIG.DYING = initSetting( 'dying', {
    name: i18n('TOKEN_HEALTH.whenDying'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dying"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DYING = key;
    },
  });
  CONFIG.TokenHealth.DYING = TH_CONFIG.DYING; // = game.settings.get(MODULE_NAME, 'dying');
  // token chat if you apply damage to the dead
  TH_CONFIG.DEAD = initSetting( 'dead', {
    name: i18n('TOKEN_HEALTH.whenDead'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dead"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DEAD = key;
    },
  });
  CONFIG.TokenHealth.DEAD = TH_CONFIG.DEAD; // = game.settings.get(MODULE_NAME, 'dead');
  // token chat if taking healing (Players & GM)
  TH_CONFIG.TY = initSetting( 'ty', {
    name: i18n('TOKEN_HEALTH.healName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ty"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TY = key;
    },
  });
  CONFIG.TokenHealth.TY = TH_CONFIG.TY; // = game.settings.get(MODULE_NAME, 'ty');
  // token chat if takeing 1 point of healing (GM Only)
  TH_CONFIG.HEALING_POINT = initSetting( 'healingPoint', {
    name: i18n('TOKEN_HEALTH.minorHealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HEALING_POINT = key;
    },
  });
  CONFIG.TokenHealth.HEALING_POINT = TH_CONFIG.HEALING_POINT; // = game.settings.get(MODULE_NAME, 'healingPoint');
  // token chat if takeing > 1 points of healing (GM Only)
  TH_CONFIG.HEALING_POINTS = initSetting( 'healingPoints', {
    name: i18n('TOKEN_HEALTH.HealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HEALING_POINTS = key;
    },
  });
  CONFIG.TokenHealth.HEALING_POINTS = TH_CONFIG.HEALING_POINTS; // = game.settings.get(MODULE_NAME, 'healingPoints');
  // token chat if no damage or healing taken (all was mitigated/none needed)
  TH_CONFIG.MEH = initSetting( 'meh', {
    name: i18n('TOKEN_HEALTH.noEffectName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.meh"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MEH = key;
    },
  });
  CONFIG.TokenHealth.MEH = TH_CONFIG.MEH; // = game.settings.get(MODULE_NAME, 'meh');
  // token chat if taking the injured condition (AGE-System Specific)
  TH_CONFIG.INJURED = initSetting( 'injured', {
    name: i18n('TOKEN_HEALTH.whenInjured'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.injured"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.INJURED = key;
    },
  });
  CONFIG.TokenHealth.INJURED = TH_CONFIG.INJURED; // = game.settings.get(MODULE_NAME, 'injured');
  // token chat if taking the wonded condition (AGE-System Specific)
  TH_CONFIG.WOUNDED = initSetting( 'wounded', {
    name: i18n('TOKEN_HEALTH.whenWounded'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.wounded"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.WOUNDED = key;
    },
  });
  CONFIG.TokenHealth.WOUNDED = TH_CONFIG.WOUNDED; // = game.settings.get(MODULE_NAME, 'wounded');
  // CONFIG.TokenHealth = TH_CONFIG;
  // console.log(TH_CONFIG)
  // console.log(CONFIG)
}

export default () => {
  setDefaults();
  CONFIG.TokenHealth = {};

  /*************** TOKEN HEALTH TH_CONFIGURATION SETTINGS ***************/
  // Enable/disable display of token thumbnail images in dialog box
  game.settings.register(MODULE_NAME, 'enableTokenImages', {
    name: i18n('TOKEN_HEALTH.enableTokenImages'),
    hint: i18n('TOKEN_HEALTH.enableTokenImagesHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_IMAGES,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_TOKEN_IMAGES = key;
    },
  });
  TH_CONFIG.ENABLE_TOKEN_IMAGES = game.settings.get(MODULE_NAME, 'enableTokenImages');
  // Enable/disable ability for players to launch Token Health
  game.settings.register(MODULE_NAME, 'restrictPlayerLaunch', {
    name: i18n('TOKEN_HEALTH.restrictPlayerLaunch'),
    hint: i18n('TOKEN_HEALTH.restrictPlayerLaunchHint'),
    type: Boolean,
    default: DEFAULT.RESTRICT_PLAYER_LAUNCH,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.RESTRICT_PLAYER_LAUNCH = key;

      // console.log("restrictPlayerLaunch.onChange")
      // TOGGLE_KEY_BASE: 'Enter'
      // let key1 = game.keybindings.actions.get("token-health.damageSelectedTokens");
      // console.log("Was damageSelectedTokens.restricted:", key1.restricted)
      // key1.restricted = key;
      // let key1new = game.keybindings.actions.get("token-health.damageSelectedTokens");
      // console.log("Updated damageSelectedTokens.restricted:", key1new.restricted)
        
      // TOGGLE_KEY_ALT: 'Shift + Enter'
      // let key2 = game.keybindings.actions.get("token-health.healSelectedTokens");
      // console.log("Was healSelectedTokens.restricted:", key2.restricted)
      // key2.restricted = key;
      // let key2new = game.keybindings.actions.get("token-health.healSelectedTokens");
      // console.log("Updated healSelectedTokens.restricted:", key2new.restricted)
        
      // TOGGLE_KEY_TARGET: 'Alt + Enter'
      // let key3 = game.keybindings.actions.get("token-health.damageTargetedTokens");
      // console.log("Was damageTargetedTokens.restricted:", key3.restricted)
      // key3.restricted = key;
      // let key3new = game.keybindings.actions.get("token-health.damageTargetedTokens");
      // console.log("Updated damageTargetedTokens.restricted:", key3new.restricted)
        
      // TOGGLE_KEY_TARGET_ALT: 'Alt + Shift + Enter'
      // let key4 = game.keybindings.actions.get("token-health.healTargetedTokens");
      // console.log("Was healTargetedTokens.restricted:", key4.restricted)
      // key4.restricted = key;
      // let key4new = game.keybindings.actions.get("token-health.healTargetedTokens");
      // console.log("Updated healTargetedTokens.restricted:", key4new.restricted)
    },
  });
  CONFIG.TokenHealth.RESTRICT_PLAYER_LAUNCH = game.settings.get(MODULE_NAME, 'restrictPlayerLaunch');
  // UI warning message sent to player if they try to launch Token Health when GM has restricgted it
  game.settings.register(MODULE_NAME, 'worthy', {
    name: i18n('TOKEN_HEALTH.worthy'),
    hint: i18n('TOKEN_HEALTH.worthyHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.worthyMsg"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.WORTHY = key;
    },
  });
  CONFIG.TokenHealth.WORTHY = game.settings.get(MODULE_NAME, 'worthy');
  // UI warning message sent to player if they try to launch Token Health for tokens they don't own
  game.settings.register(MODULE_NAME, 'access', {
    name: i18n('TOKEN_HEALTH.access'),
    hint: i18n('TOKEN_HEALTH.accessHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.accessMsg"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ACCESS = key;
    },
  });
  CONFIG.TokenHealth.ACCESS = game.settings.get(MODULE_NAME, 'access');
  // Enable/disable Additive Damage (for systems like SWADE, L5R5E, and TORG)
  game.settings.register(MODULE_NAME, 'damageAdds', {
    name: i18n('TOKEN_HEALTH.damageAdds'),
    hint: i18n('TOKEN_HEALTH.damageAddsHint'),
    type: Boolean,
    default: DEFAULT.ADDITIVE_DAMAGE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ADDITIVE_DAMAGE = key;
    },
  });
  TH_CONFIG.ADDITIVE_DAMAGE = game.settings.get(MODULE_NAME, 'damageAdds');
  // Primary damage type (optional)
  game.settings.register(MODULE_NAME, 'damageType1', {
    name: i18n('TOKEN_HEALTH.damageType1'),
    hint: i18n('TOKEN_HEALTH.damageType1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_1 = key;
    },
  });
  TH_CONFIG.DAMAGE_TYPE_1 = game.settings.get(MODULE_NAME, 'damageType1');
  // Secondary damage type (optional)
  game.settings.register(MODULE_NAME, 'damageType2', {
    name: i18n('TOKEN_HEALTH.damageType2'),
    hint: i18n('TOKEN_HEALTH.damageType2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_2 = key;
    },
  });
  TH_CONFIG.DAMAGE_TYPE_2 = game.settings.get(MODULE_NAME, 'damageType2');
  // Tertiary damage type (optional)
  game.settings.register(MODULE_NAME, 'damageType3', {
    name: i18n('TOKEN_HEALTH.damageType3'),
    hint: i18n('TOKEN_HEALTH.damageType3Hint'),
    type: String,
    default: DEFAULT.DAMAGE_TYPE_3,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_TYPE_3 = key;
    },
  });
  TH_CONFIG.DAMAGE_TYPE_3 = game.settings.get(MODULE_NAME, 'damageType3');
  // Primary damage mitigation attribute (optional)
  game.settings.register(MODULE_NAME, 'mitigationSource1', {
    name: i18n('TOKEN_HEALTH.mitigation1'),
    hint: i18n('TOKEN_HEALTH.mitigation1Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_1 = key;
    },
  });
  TH_CONFIG.MITIGATION_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'mitigationSource1');
  // Secondary damage mitigation attribute (optional)
  game.settings.register(MODULE_NAME, 'mitigationSource2', {
    name: i18n('TOKEN_HEALTH.mitigation2'),
    hint: i18n('TOKEN_HEALTH.mitigation2Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_2 = key;
    },
  });
  TH_CONFIG.MITIGATION_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'mitigationSource2');
  // Tertiary damage mitigation attribute (optional)
  game.settings.register(MODULE_NAME, 'mitigationSource3', {
    name: i18n('TOKEN_HEALTH.mitigation3'),
    hint: i18n('TOKEN_HEALTH.mitigation3Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_3,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MITIGATION_ATTRIBUTE_3 = key;
    },
  });
  TH_CONFIG.MITIGATION_ATTRIBUTE_3 = game.settings.get(MODULE_NAME, 'mitigationSource3');
  // Primary damage subtype (required)
  game.settings.register(MODULE_NAME, 'damageSubtype1', {
    name: i18n('TOKEN_HEALTH.damageSubtype1'),
    hint: i18n('TOKEN_HEALTH.damageSubtype1Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_SUBTYPE_1 = key;
    },
  });
  TH_CONFIG.DAMAGE_SUBTYPE_1 = game.settings.get(MODULE_NAME, 'damageSubtype1');
  // Attribute recording current health (required)
  game.settings.register(MODULE_NAME, 'hpSource1', {
    name: i18n('TOKEN_HEALTH.hp1'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  TH_CONFIG.HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'hpSource1');
  // Attribute recording max possible health (required)
  game.settings.register(MODULE_NAME, 'hpSourceMax1', {
    name: i18n('TOKEN_HEALTH.hpMax1'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'hpSourceMax1');
  // Attribute recording secondary max possible health pool (optional) - *** NEW! ***
  game.settings.register(MODULE_NAME, 'altHpSourceMax1', {
    name: i18n('TOKEN_HEALTH.altHpMax1'),
    hint: i18n('TOKEN_HEALTH.altHpMax1Hint'),
    type: String,
    default: DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'altHpSourceMax1');
  // Attribute for recording/tracking temporary health (optional)
  game.settings.register(MODULE_NAME, 'tempHpSource1', {
    name: i18n('TOKEN_HEALTH.tempHp1'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_1 = key;
    },
  });
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_1 = game.settings.get(MODULE_NAME, 'tempHpSource1');
  // Secondary damage type (optional)
  game.settings.register(MODULE_NAME, 'damageSubtype2', {
    name: i18n('TOKEN_HEALTH.damageSubtype2'),
    hint: i18n('TOKEN_HEALTH.damageSubtype2Hint'),
    type: String,
    default: DEFAULT.DAMAGE_SUBTYPE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_SUBTYPE_2 = key;
    },
  });
  TH_CONFIG.DAMAGE_SUBTYPE_2 = game.settings.get(MODULE_NAME, 'damageSubtype2');
  // Attribute recording current health (optional)
  game.settings.register(MODULE_NAME, 'hpSource2', {
    name: i18n('TOKEN_HEALTH.hp2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  TH_CONFIG.HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'hpSource2');
  // Attribute recording max possible health (optional)
  game.settings.register(MODULE_NAME, 'hpSourceMax2', {
    name: i18n('TOKEN_HEALTH.hpMax2'),
    hint: i18n('TOKEN_HEALTH.hpHint'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MAX_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  TH_CONFIG.MAX_HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'hpSourceMax2');
  // Attribute recording secondary max possible health pool (optional) - *** NEW! ***
  game.settings.register(MODULE_NAME, 'altHpSourceMax2', {
    name: i18n('TOKEN_HEALTH.altHpMax2'),
    hint: i18n('TOKEN_HEALTH.altHpMax2Hint'),
    type: String,
    default: DEFAULT.ALT_MAX_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALT_MAX_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  TH_CONFIG.ALT_MAX_HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'altHpSourceMax2');
  // Attribute for recording/tracking temporary health (optional)
  game.settings.register(MODULE_NAME, 'tempHpSource2', {
    name: i18n('TOKEN_HEALTH.tempHp2'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TEMP_HITPOINTS_ATTRIBUTE_2 = key;
    },
  });
  TH_CONFIG.TEMP_HITPOINTS_ATTRIBUTE_2 = game.settings.get(MODULE_NAME, 'tempHpSource2');
  // Enable/Disable allowing health to go negative
  game.settings.register(MODULE_NAME, 'allowNegative', {
    name: i18n('TOKEN_HEALTH.allowNegative'),
    hint: i18n('TOKEN_HEALTH.allowNegativeHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_NEGATIVE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALLOW_NEGATIVE = key;
    },
  });
  TH_CONFIG.ALLOW_NEGATIVE = game.settings.get(MODULE_NAME, 'allowNegative');
  // Health threshold for unconsciousness (not applicable for Additivie Damage systems)
  game.settings.register(MODULE_NAME, 'koThreshold', {
    name: i18n('TOKEN_HEALTH.koThreshold'),
    hint: i18n('TOKEN_HEALTH.koThresholdHint'),
    type: Number,
    default: DEFAULT.KO_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.KO_THRESHOLD = key;
    },
  });
  TH_CONFIG.KO_THRESHOLD = game.settings.get(MODULE_NAME, 'koThreshold');
  // Health threshold for dying (not applicable for Additivie Damage systems)
  game.settings.register(MODULE_NAME, 'deathThreshold', {
    name: i18n('TOKEN_HEALTH.deathThreshold'),
    hint: i18n('TOKEN_HEALTH.deathThresholdHint'),
    type: Number,
    default: DEFAULT.DEATH_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DEATH_THRESHOLD = key;
    },
  });
  TH_CONFIG.DEATH_THRESHOLD = game.settings.get(MODULE_NAME, 'deathThreshold');
  // Enable/Disable Setting Condition s (AGE System Specific)
  game.settings.register(MODULE_NAME, 'enableConditions', {
    name: i18n('TOKEN_HEALTH.enableConditions'),
    hint: i18n('TOKEN_HEALTH.enableConditionsHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_CONDITIONS,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_CONDITIONS = key;
    },
  });
  TH_CONFIG.ENABLE_CONDITIONS = game.settings.get(MODULE_NAME, 'enableConditions');
  // Permit Buyoff of Damage (AGE System Specific)
  game.settings.register(MODULE_NAME, 'allowDamageBuyoff', {
    name: i18n('TOKEN_HEALTH.allowDamageBuyoff'),
    hint: i18n('TOKEN_HEALTH.allowDamageBuyoffHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_DAMAGE_BUYOFF,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ALLOW_DAMAGE_BUYOFF = key;
    },
  });
  TH_CONFIG.ALLOW_DAMAGE_BUYOFF = game.settings.get(MODULE_NAME, 'allowDamageBuyoff');
  // Enable/Disable token chat messages
  game.settings.register(MODULE_NAME, 'enableChat', {
    name: i18n('TOKEN_HEALTH.enableTokenChat'),
    hint: i18n('TOKEN_HEALTH.enableTokenChatHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_CHAT,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.ENABLE_TOKEN_CHAT = key;
    },
  });
  TH_CONFIG.ENABLE_TOKEN_CHAT = game.settings.get(MODULE_NAME, 'enableChat');
  // token chat if takeing damage (Players & GM)
  game.settings.register(MODULE_NAME, 'ouch', {
    name: i18n('TOKEN_HEALTH.harmName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ouch"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.OUCH = key;
    },
  });
  TH_CONFIG.OUCH = game.settings.get(MODULE_NAME, 'ouch');
  // token chat if takeing 1 point of damage (GM Only)
  game.settings.register(MODULE_NAME, 'damagePoint', {
    name: i18n('TOKEN_HEALTH.minorDamageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_POINT = key;
    },
  });
  TH_CONFIG.DAMAGE_POINT = game.settings.get(MODULE_NAME, 'damagePoint');
  // token chat if takeing >1 points of damage (GM Only)
  game.settings.register(MODULE_NAME, 'damagePoints', {
    name: i18n('TOKEN_HEALTH.damageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DAMAGE_POINTS = key;
    },
  });
  TH_CONFIG.DAMAGE_POINTS = game.settings.get(MODULE_NAME, 'damagePoints');
  // token chat if damage results in unconscious
  game.settings.register(MODULE_NAME, 'unconscious', {
    name: i18n('TOKEN_HEALTH.whenUnconcious'),
    hint: i18n('TOKEN_HEALTH.whenUnconciousHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.unconscious"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.UNCONSCIOUS = key;
    },
  });
  TH_CONFIG.UNCONSCIOUS = game.settings.get(MODULE_NAME, 'unconscious');
  // token chat if damage results in death
  game.settings.register(MODULE_NAME, 'dying', {
    name: i18n('TOKEN_HEALTH.whenDying'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dying"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DYING = key;
    },
  });
  TH_CONFIG.DYING = game.settings.get(MODULE_NAME, 'dying');
  // token chat if you apply damage to the dead
  game.settings.register(MODULE_NAME, 'dead', {
    name: i18n('TOKEN_HEALTH.whenDead'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dead"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.DEAD = key;
    },
  });
  TH_CONFIG.DEAD = game.settings.get(MODULE_NAME, 'dead');
  // token chat if taking healing (Players & GM)
  game.settings.register(MODULE_NAME, 'ty', {
    name: i18n('TOKEN_HEALTH.healName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ty"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.TY = key;
    },
  });
  TH_CONFIG.TY = game.settings.get(MODULE_NAME, 'ty');
  // token chat if takeing 1 point of healing (GM Only)
  game.settings.register(MODULE_NAME, 'healingPoint', {
    name: i18n('TOKEN_HEALTH.minorHealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HEALING_POINT = key;
    },
  });
  TH_CONFIG.HEALING_POINT = game.settings.get(MODULE_NAME, 'healingPoint');
  // token chat if takeing > 1 points of healing (GM Only)
  game.settings.register(MODULE_NAME, 'healingPoints', {
    name: i18n('TOKEN_HEALTH.HealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.HEALING_POINTS = key;
    },
  });
  TH_CONFIG.HEALING_POINTS = game.settings.get(MODULE_NAME, 'healingPoints');
  // token chat if no damage or healing taken (all was mitigated/none needed)
  game.settings.register(MODULE_NAME, 'meh', {
    name: i18n('TOKEN_HEALTH.noEffectName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.meh"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.MEH = key;
    },
  });
  TH_CONFIG.MEH = game.settings.get(MODULE_NAME, 'meh');
  // token chat if taking the injured condition (AGE-System Specific)
  game.settings.register(MODULE_NAME, 'injured', {
    name: i18n('TOKEN_HEALTH.whenInjured'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.injured"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.INJURED = key;
    },
  });
  TH_CONFIG.INJURED = game.settings.get(MODULE_NAME, 'injured');
  // token chat if taking the wonded condition (AGE-System Specific)
  game.settings.register(MODULE_NAME, 'wounded', {
    name: i18n('TOKEN_HEALTH.whenWounded'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.wounded"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TokenHealth.WOUNDED = key;
    },
  });
  TH_CONFIG.WOUNDED = game.settings.get(MODULE_NAME, 'wounded');
};
