// @ts-check

import settings, { CONFIG } from './settings.js';
import { i18n } from './ui.js';

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
 * @returns {Promise<Entity|Entity[]>}
 */
const applyDamage = async (html, isDamage, isTargetted) => {
  const value = html.find('input[type=number]').val();
  const damage = isDamage ? Number(value) : value * -1;

  const tokens = isTargetted ? Array.from(game.user.targets) : canvas.tokens.controlled;

  const promises = tokens.map(({ id, actor }) => {
    // Handle temp hp if any
    const data = actor.data.data;
    const hp = getProperty(data, CONFIG.HITPOINTS_ATTRIBUTE);
    const max = getProperty(data, CONFIG.MAX_HITPOINTS_ATTRIBUTE);
    const temp = getProperty(data, CONFIG.TEMP_HITPOINTS_ATTRIBUTE);

    const tmp = parseInt(temp) || 0,
      dt = damage > 0 ? Math.min(tmp, damage) : 0;

    const newTempHP = tmp - dt;
    const newHP = Math.max(hp - (damage - dt), max);

    const updates = { _id: actor.id, isToken: actor.isToken };

    if (CONFIG.HITPOINTS_ATTRIBUTE)
      updates[`data.${CONFIG.HITPOINTS_ATTRIBUTE}`] = newHP;

    if (CONFIG.TEMP_HITPOINTS_ATTRIBUTE)
      updates[`data.${CONFIG.TEMP_HITPOINTS_ATTRIBUTE}`] = newTempHP;

    // Prepare the update
    return actor.update(updates);
  });

  return Promise.all(promises);
};

/**
 * Display token Health overlay.
 *
 * @returns {Promise<void>}
 */
const displayOverlay = async (isDamage, isTargetted = false) => {
  tokenHealthDisplayed = true;

  const buttons = {
    heal: {
      icon: "<i class='fas fa-plus-circle'></i>",
      label: `${i18n('TOKEN_HEALTH.Heal')}  <kbd>⮐</kbd>`,
      callback: html => applyDamage(html, isDamage, isTargetted),
      condition: !isDamage,
    },
    damage: {
      icon: "<i class='fas fa-minus-circle'></i>",
      label: `${i18n('TOKEN_HEALTH.Damage')}  <kbd>⮐</kbd>`,
      callback: html => applyDamage(html, isDamage, isTargetted),
      condition: isDamage,
    },
  };

  const content = await renderTemplate(
    `modules/token-health/templates/token-health.hbs`
  );

  // Render the dialog
  dialog = new TokenHealthDialog({
    title: isDamage
      ? i18n('TOKEN_HEALTH.Dialog_Damage_Title')
      : i18n('TOKEN_HEALTH.Dialog_Heal_Title'),
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
  if (!tokenHealthDisplayed && canvas.tokens.controlled.length > 0 && !isTarget) {
    displayOverlay(isDamage).catch(console.error);
  }
  // Don't display if no tokents targetted and we were trying to attack selected
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

  // Targetting key is pressed
  const toggleKeyTarget = KeyBinding.parse(CONFIG.TOGGLE_KEY_TARGET);
  if (KeyBinding.eventIsForBinding(event, toggleKeyTarget))
    toggle(event, key, true, true);

  // Alt Targetting key is pressed
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
