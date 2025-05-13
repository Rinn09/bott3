/**
 * Trả về một số nguyên ngẫu nhiên trong khoảng [min, max] (bao gồm cả min và max).
 * @param {number} min - Giá trị nhỏ nhất.
 * @param {number} max - Giá trị lớn nhất.
 * @returns {number} Số nguyên ngẫu nhiên.
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  getRandomInt,
};
