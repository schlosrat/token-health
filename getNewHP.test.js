import getNewHP from './getNewHP';

test('getNewHP should return the correct values', () => {
  expect(getNewHP(10, 10, 0, 2)).toEqual([8, 0]);
  expect(getNewHP(1, 10, 0, 2)).toEqual([0, 0]);
  expect(getNewHP(0, 10, 0, 2)).toEqual([0, 0]);
  expect(getNewHP(8, 10, 0, 2)).toEqual([6, 0]);
  expect(getNewHP(10, 10, 0, -2)).toEqual([10, 0]);
  expect(getNewHP(8, 10, 0, -2)).toEqual([10, 0]);
  expect(getNewHP(0, 10, 0, -2)).toEqual([2, 0]);
  expect(getNewHP(10, 10, 0, 0)).toEqual([10, 0]);

  expect(getNewHP(10, 10, 5, 2)).toEqual([10, 3]);
  expect(getNewHP(10, 10, 5, 10)).toEqual([5, 0]);
  expect(getNewHP(10, 10, 5, 15)).toEqual([0, 0]);
  expect(getNewHP(10, 10, 5, 20)).toEqual([0, 0]);
  expect(getNewHP(10, 10, 0, 20)).toEqual([0, 0]);
  expect(getNewHP(10, 10, 30, 20)).toEqual([10, 10]);
  expect(getNewHP(10, 10, 30, 50)).toEqual([0, 0]);
  expect(getNewHP(5, 10, 30, -5)).toEqual([10, 30]);
  expect(getNewHP(10, 10, 30, -5)).toEqual([10, 30]);
  expect(getNewHP(10, 10, 0, -5)).toEqual([10, 0]);

  const opts = {allowNegative: true};
  expect(getNewHP(10, 10, 30, 20, opts)).toEqual([10, 10]);
  expect(getNewHP(10, 10, 0, 10, opts)).toEqual([0, 0]);
  expect(getNewHP(10, 10, 10, 10, opts)).toEqual([10, 0]);
  expect(getNewHP(10, 10, 10, 20, opts)).toEqual([0, 0]);
  expect(getNewHP(10, 10, 10, 30, opts)).toEqual([-10, 0]);
  expect(getNewHP(10, 10, 0, 12, opts)).toEqual([-2, 0]);
  expect(getNewHP(0, 10, 0, 12, opts)).toEqual([-12, 0]);
  expect(getNewHP(0, 10, 0, -12, opts)).toEqual([10, 0]);
});
