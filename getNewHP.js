/**
 * Get the new HP value
 * @param {number} currentHP - Current HP value
 * @param {number} maxHP - Max HP value
 * @param {number} tempHP - Current Temp HP value
 * @param {number} value - Value to apply (can be positive or negative)
 * @param {object} [options]
 * @param {boolean} [options.allowNegative] - Can the return HP value be negative?
 * @returns {[number, number]} - HP value and Temp HP value
 */
const getNewHP = (currentHP, maxHP, tempHP, value, options = {}) => {
  // Store the temp HP value
  const tmp = Number(tempHP) ?? 0;

  // Calculate value to apply on temp only
  const dt = value > 0 ? Math.min(tmp, value) : 0;

  // Apply value to temp
  const temp = tmp - dt;

  // Get new HP value after applying some of it to temp
  let tmpHP = currentHP - (value - dt);

  // Make sure to return a negative number if allowed
  if (!options.allowNegative) tmpHP = Math.max(tmpHP, 0);

  // Make sure the hp value is less than max
  const hp = Math.min(tmpHP, maxHP);

  return [hp, temp];
};

export default getNewHP;
