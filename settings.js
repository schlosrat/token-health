import { i18n } from './ui.js';
import { hotkeys } from '../lib-df-hotkeys/lib-df-hotkeys.shim.js';

const MODULE_NAME = 'token-health';

export const CONFIG = {};
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
  HITPOINTS_ATTRIBUTE: '',
  MAX_HITPOINTS_ATTRIBUTE: '',
  TEMP_HITPOINTS_ATTRIBUTE: '',
  MITIGATION_ATTRIBUTE_1: '',
  MITIGATION_ATTRIBUTE_2: '',
  MITIGATION_ATTRIBUTE_3: '',
  KO_THRESHOLD: 0,
  DEATH_THRESHOLD: 0,
  ALLOW_NEGATIVE: false,
  ALLOW_TEMP: false,
  ALLOW_DAMAGE_BUYOFF: false,
  ENABLE_TOKEN_CHAT: true,
};

/**
 * Set all default settings, based on game system
 */
const setDefaults = () => {
  // Default to system values
  if (game.system.id === 'dnd5e' || game.system.id === 'pf1' || game.system.id === 'pf2e') {
    DEFAULT.HITPOINTS_ATTRIBUTE = 'attributes.hp.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE = 'attributes.hp.max';
    DEFAULT.TEMP_HITPOINTS_ATTRIBUTE = 'attributes.hp.temp';
    DEFAULT.ALLOW_DAMAGE_BUYOFF = false;
    DEFAULT.KO_THRESHOLD = 0;
    DEFAULT.DEATH_THRESHOLD = 0;
  } else if (game.system.id === 'age-system') {
    DEFAULT.HITPOINTS_ATTRIBUTE = 'health.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE = 'health.max';
    DEFAULT.MITIGATION_ATTRIBUTE_1 = 'armor.toughness.total';
    DEFAULT.MITIGATION_ATTRIBUTE_2 = 'armor.impact';
    DEFAULT.MITIGATION_ATTRIBUTE_3 = 'armor.ballistic';
    DEFAULT.KO_THRESHOLD = 0;
    DEFAULT.DEATH_THRESHOLD = 0;
    if (game.settings.get("age-system", "useConditions")) {
      DEFAULT.ALLOW_DAMAGE_BUYOFF = true; // this may be questionable...
    } else {
      DEFAULT.ALLOW_DAMAGE_BUYOFF = false;
    }
  } else {
    DEFAULT.HITPOINTS_ATTRIBUTE = 'health.value';
    DEFAULT.MAX_HITPOINTS_ATTRIBUTE = 'health.max';
    DEFAULT.ALLOW_DAMAGE_BUYOFF = false;
    DEFAULT.KO_THRESHOLD = 0;
    DEFAULT.DEATH_THRESHOLD = 0;
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
  let config;

  try {
    config = game.settings.get(MODULE_NAME, key);
  } catch (e) {
    if (e.message === 'This is not a registered game setting') {
      game.settings.register(MODULE_NAME, key, setting);
      config = game.settings.get(MODULE_NAME, key);
    } else {
      throw e;
    }
  }

  return config;
};

// SDR: Must get away from window.Azzu.SettingsTypes.KeyBinding (borken in 0.8.x)
// Switching to DF Hotkeys
// const KeyBinding = window.Azzu.SettingsTypes.KeyBinding;

//KEYBIND SETTINGS
/*
game.settings.register("token-health", "toggleKey", {
  scope: 'user',
  config: false,
  default: {
      key: hotkeys.keys.Enter,
      alt: false,
      ctrl: false,
      shift: false
  }
});
game.settings.register("token-health", "toggleKeyAlt", {
  scope: 'user',
  config: false,
  default: {
      key: hotkeys.keys.Enter,
      alt: false,
      ctrl: false,
      shift: true
  }
});
game.settings.register("token-health", "toggleKeyTarget", {
  scope: 'user',
  config: false,
  default: {
      key: hotkeys.keys.Enter,
      alt: true,
      ctrl: false,
      shift: false
  }
});
game.settings.register("token-health", "toggleKeyTargetAlt", {
  scope: 'user',
  config: false,
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

  CONFIG.TOGGLE_KEY_BASE = initSetting('toggleKey', {
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
    config: false,
    onChange: key => {
      CONFIG.TOGGLE_KEY_BASE = key;
    },
  });
  CONFIG.TOGGLE_KEY_ALT = initSetting('toggleKeyAlt', {
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
    config: false,
    onChange: key => {
      CONFIG.TOGGLE_KEY_ALT = key;
    },
  });
  CONFIG.TOGGLE_KEY_TARGET = initSetting('toggleKeyTarget', {
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
    config: false,
    onChange: key => {
      CONFIG.TOGGLE_KEY_TARGET = key;
    },
  });
  CONFIG.TOGGLE_KEY_TARGET_ALT = initSetting('toggleKeyTargetAlt', {
    name: i18n('TOKEN_HEALTH.toggleKeyTargetAltName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyTargetAltHint'),
    // type: KeyBinding,
    // default: DEFAULT.TOGGLE_KEY_TARGET_ALT,
    default: {
      key: hotkeys.keys.Enter,
      alt: true,
      ctrl: false,
      shift: true
    },
    scope: 'user',
    config: false,
    onChange: key => {
      CONFIG.TOGGLE_KEY_TARGET_ALT = key;
    },
  });

  CONFIG.HITPOINTS_ATTRIBUTE = initSetting('hpSource', {
    name: i18n('TOKEN_HEALTH.hp'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.HITPOINTS_ATTRIBUTE = key;
    },
  });
  CONFIG.MAX_HITPOINTS_ATTRIBUTE = initSetting('hpSourceMax', {
    name: i18n('TOKEN_HEALTH.hpMax'),
    type: String,
    default: DEFAULT.MAX_HITPOINTS_ATTRIBUTE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.MAX_HITPOINTS_ATTRIBUTE = key;
    },
  });
  CONFIG.TEMP_HITPOINTS_ATTRIBUTE = initSetting('tempHpSource', {
    name: i18n('TOKEN_HEALTH.tempHp'),
    hint: i18n('TOKEN_HEALTH.tempHpHint'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TEMP_HITPOINTS_ATTRIBUTE = key;
    },
  });
  CONFIG.MITIGATION_ATTRIBUTE_1 = initSetting('mitigationSource1', {
    name: i18n('TOKEN_HEALTH.mitigation1'),
    hint: i18n('TOKEN_HEALTH.mitigation1Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_1,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.MITIGATION_ATTRIBUTE_1 = key;
    },
  });
  CONFIG.MITIGATION_ATTRIBUTE_2 = initSetting('mitigationSource2', {
    name: i18n('TOKEN_HEALTH.mitigation2'),
    hint: i18n('TOKEN_HEALTH.mitigation2Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_2,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.MITIGATION_ATTRIBUTE_2 = key;
    },
  });
  CONFIG.MITIGATION_ATTRIBUTE_3 = initSetting('mitigationSource3', {
    name: i18n('TOKEN_HEALTH.mitigation3'),
    hint: i18n('TOKEN_HEALTH.mitigation3Hint'),
    type: String,
    default: DEFAULT.MITIGATION_ATTRIBUTE_3,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.MITIGATION_ATTRIBUTE_3 = key;
    },
  });
  CONFIG.KO_THRESHOLD = initSetting('koThreshold', {
    name: i18n('TOKEN_HEALTH.koThreshold'),
    hint: i18n('TOKEN_HEALTH.koThresholdHint'),
    type: Number,
    default: DEFAULT.KO_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.KO_THRESHOLD = key;
    },
  });
  CONFIG.DEATH_THRESHOLD = initSetting('deathThreshold', {
    name: i18n('TOKEN_HEALTH.deathThreshold'),
    hint: i18n('TOKEN_HEALTH.deathThresholdHint'),
    type: Number,
    default: DEFAULT.DEATH_THRESHOLD,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.DEATH_THRESHOLD = key;
    },
  });
  CONFIG.ALLOW_NEGATIVE = initSetting('allowNegative', {
    name: i18n('TOKEN_HEALTH.allowNegative'),
    hint: i18n('TOKEN_HEALTH.allowNegativeHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_NEGATIVE,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.ALLOW_NEGATIVE = key;
    },
  });
  // Permit Buyoff of Damage (AGE-System Specific)
  CONFIG.ALLOW_DAMAGE_BUYOFF = initSetting('allowDamageBuyoff', {
    name: i18n('TOKEN_HEALTH.allowDamageBuyoff'),
    hint: i18n('TOKEN_HEALTH.allowDamageBuyoffHint'),
    type: Boolean,
    default: DEFAULT.ALLOW_DAMAGE_BUYOFF,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.ALLOW_DAMAGE_BUYOFF = key;
    },
  });
  // Enable/Disable token chat messages
  CONFIG.ENABLE_TOKEN_CHAT = initSetting('enableChat', {
    name: i18n('TOKEN_HEALTH.enableTokenChat'),
    hint: i18n('TOKEN_HEALTH.enableTokenChatHint'),
    type: Boolean,
    default: DEFAULT.ENABLE_TOKEN_CHAT,
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.ENABLE_TOKEN_CHAT = key;
    },
  });
  // token chat if takeing damage (Players & GM)
  CONFIG.OUCH = initSetting('ouch', {
    name: i18n('TOKEN_HEALTH.harmName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ouch"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.OUCH = key;
    },
  });
  // token chat if takeing 1 point of damage (GM Only)
  CONFIG.DAMAGE_POINT = initSetting('damagePoint', {
    name: i18n('TOKEN_HEALTH.minorDamageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.DAMAGE_POINT = key;
    },
  });
  // token chat if takeing >1 points of damage (GM Only)
  CONFIG.DAMAGE_POINTS = initSetting('damagePoints', {
    name: i18n('TOKEN_HEALTH.damageName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.damagePoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.DAMAGE_POINTS = key;
    },
  });
  // token chat if damage results in unconscious
  CONFIG.UNCONSCIOUS = initSetting('unconscious', {
    name: i18n('TOKEN_HEALTH.whenUnconcious'),
    hint: i18n('TOKEN_HEALTH.whenUnconciousHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.unconscious"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.UNCONSCIOUS = key;
    },
  });
  // token chat if damage results in death
  CONFIG.DYING = initSetting('dying', {
    name: i18n('TOKEN_HEALTH.whenDying'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dying"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.DYING = key;
    },
  });
  // token chat if you apply damage to the dead
  CONFIG.DEAD = initSetting('dead', {
    name: i18n('TOKEN_HEALTH.whenDead'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.dead"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.DEAD = key;
    },
  });
  // token chat if taking healing (Players & GM)
  CONFIG.TY = initSetting('ty', {
    name: i18n('TOKEN_HEALTH.healName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.ty"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.TY = key;
    },
  });
  // token chat if takeing 1 point of healing (GM Only)
  CONFIG.HEALING_POINT = initSetting('healingPoint', {
    name: i18n('TOKEN_HEALTH.minorHealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoint"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.HEALING_POINT = key;
    },
  });
  // token chat if takeing > 1 points of healing (GM Only)
  CONFIG.HEALING_POINTS = initSetting('healingPoints', {
    name: i18n('TOKEN_HEALTH.HealingName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHintGM'),
    type: String,
    default: i18n("TOKEN_HEALTH.healingPoints"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.HEALING_POINTS = key;
    },
  });
  // token chat if no damage or healing taken (all was mitigated/none needed)
  CONFIG.MEH = initSetting('meh', {
    name: i18n('TOKEN_HEALTH.noEffectName'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.meh"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.MEH = key;
    },
  });
  // token chat if taking the injured condition (AGE-System Specific)
  CONFIG.INJURED = initSetting('injured', {
    name: i18n('TOKEN_HEALTH.whenInjured'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.injured"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.INJURED = key;
    },
  });
  // token chat if taking the wonded condition (AGE-System Specific)
  CONFIG.WOUNDED = initSetting('wounded', {
    name: i18n('TOKEN_HEALTH.whenWounded'),
    hint: i18n('TOKEN_HEALTH.tokenChatHint'),
    type: String,
    default: i18n("TOKEN_HEALTH.wounded"),
    scope: 'world',
    config: true,
    onChange: key => {
      CONFIG.WOUNDED = key;
    },
  });
};
