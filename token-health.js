// @ts-check

import settings, {CONFIG} from './settings.js';
import {i18n} from './ui.js';

const DELAY = 400;

let tokenHealthDisplayed = false;
let dialog, timer;

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

  const promises = tokens.map(({id, actor}) => {
    // Handle temp hp if any
    const data = actor.data.data;
    const hp = getProperty(data, CONFIG.HITPOINTS_ATTRIBUTE);
    const max = getProperty(data, CONFIG.MAX_HITPOINTS_ATTRIBUTE);
    const temp = getProperty(data, CONFIG.TEMP_HITPOINTS_ATTRIBUTE);

    const tmp = parseInt(temp) || 0,
      dt = damage > 0 ? Math.min(tmp, damage) : 0;

    const newTempHP = tmp - dt;
    const newHP = Math.clamped(hp - (damage - dt), 0, max);

    const updates = {_id: actor.id, isToken: actor.isToken};

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
const onToggle = (event, key) => {
  event.preventDefault();

  // Make sure to call only once.
  keyboard._handled.add(key);

  if (!tokenHealthDisplayed && canvas.tokens.controlled.length > 0) {
    displayOverlay().catch(console.error);
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

  if (key === CONFIG.TOGGLE_KEY) onToggle(event, key);
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
});
