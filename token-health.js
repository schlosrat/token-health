// @ts-check

const DEFAULT = {
  TOGGLE_KEY: 'Enter',
  HITPOINTS_ATTRIBUTE: 'attributes.hp.value',
  TEMP_HITPOINTS_ATTRIBUTE: 'attributes.hp.temp',
};

const CONFIG = {...DEFAULT};

let tokenHealthDisplayed = false;
let dialog;

/**
 * Shorthand, thanks minor-qol =)
 *
 * @param {string} key The translation key
 * @returns {String|string} The translated string
 */
const i18n = key => game.i18n.localize(key);

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
 * @returns {Promise<Entity|Entity[]>}
 */
const applyDamage = async (html, isDamage) => {
  const value = html.find('input[type=number]').val();
  const damage = isDamage ? Number(value) : value * -1;
  const tokens = canvas.tokens.controlled;

  const promises = tokens.map(({actor}) => {
    // Handle temp hp if any
    const hp = actor.data.data.attributes.hp,
      tmp = parseInt(hp.temp) || 0,
      dt = damage > 0 ? Math.min(tmp, damage) : 0;

    const newTempHP = tmp - dt;
    const newHP = Math.clamped(hp.value - (damage - dt), 0, hp.max);

    // Prepare the update
    return actor.update({
      [`data.${CONFIG.TEMP_HITPOINTS_ATTRIBUTE}`]: newTempHP,
      [`data.${CONFIG.HITPOINTS_ATTRIBUTE}`]: newHP,
    });
  });

  return Promise.all(promises);
};

/**
 * Display token Health overlay.
 *
 * @returns {Promise<void>}
 */
const displayOverlay = async () => {
  tokenHealthDisplayed = true;

  const content = await renderTemplate(
    `modules/token-health/templates/token-health.hbs`
  );

  const buttons = {
    heal: {
      icon: "<i class='fas fa-plus-circle'></i>",
      label: i18n('TOKEN_HEALTH.Heal'),
      callback: html => applyDamage(html, false),
    },
    damage: {
      icon: "<i class='fas fa-minus-circle'></i>",
      label: i18n('TOKEN_HEALTH.Damage'),
      callback: html => applyDamage(html, true),
    },
  };

  // Render the dialog
  dialog = new TokenHealthDialog({
    title: i18n('TOKEN_HEALTH.Dialog_Title'),
    content,
    buttons,
    default: 'damage',
    close: () => {
      tokenHealthDisplayed = false;
    },
  }).render(true);
};

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
const onToggle = event => {
  event.preventDefault();
  if (!tokenHealthDisplayed && canvas.tokens.controlled.length > 0) {
    displayOverlay().catch(console.error);
  }
};

/**
 * Handle custom keys not handled by FVTT
 *
 * @param {KeyboardEvent} event The keyboard event
 * @param {string} key The pressed key
 */
const handleKeys = function (event, key) {
  if (!this.hasFocus && key === CONFIG.TOGGLE_KEY) onToggle(event);
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

  // Register our settings
  game.settings.register('token-health', 'toggleKey', {
    name: i18n('TOKEN_HEALTH.toggleKeyName'),
    hint: i18n('TOKEN_HEALTH.toggleKeyHint'),
    type: window.Azzu.SettingsTypes.KeyBinding,
    default: DEFAULT.TOGGLE_KEY,
    scope: 'user',
    config: true,
    onChange: key => {
      CONFIG.TOGGLE_KEY = key;
    },
  });
  game.settings.register('token-health', 'hpSource', {
    name: i18n('TOKEN_HEALTH.hp'),
    type: String,
    default: DEFAULT.HITPOINTS_ATTRIBUTE,
    scope: 'client',
    config: true,
    onChange: key => {
      CONFIG.HITPOINTS_ATTRIBUTE = key;
    },
  });
  game.settings.register('token-health', 'tempHpSource', {
    name: i18n('TOKEN_HEALTH.tempHp'),
    type: String,
    default: DEFAULT.TEMP_HITPOINTS_ATTRIBUTE,
    scope: 'client',
    config: true,
    onChange: key => {
      CONFIG.TEMP_HITPOINTS_ATTRIBUTE = key;
    },
  });

  CONFIG.TOGGLE_KEY = game.settings.get('token-health', 'toggleKey');
  CONFIG.HITPOINTS_ATTRIBUTE = game.settings.get('token-health', 'hpSource');
  CONFIG.TEMP_HITPOINTS_ATTRIBUTE = game.settings.get(
    'token-health',
    'tempHpSource'
  );
});
