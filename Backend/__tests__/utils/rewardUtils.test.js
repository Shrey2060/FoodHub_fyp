const { calculateRewardPoints, calculateDiscountAmount } = require('../../utils/rewardUtils');

describe('rewardUtils', () => {
  describe('calculateRewardPoints', () => {
    it('should calculate reward points correctly for RESTAURANT order type', () => {
      const orderAmount = 100;
      const orderType = 'RESTAURANT';
      const settings = {
        points_per_rupee: 1,
        restaurant_bonus_percentage: 10
      };
      const result = calculateRewardPoints(orderAmount, orderType, settings);
      expect(result.basePoints).toBe(100);
      expect(result.bonusPoints).toBe(10);
      expect(result.totalPoints).toBe(110);
    });

    it('should calculate reward points correctly for CAFE order type', () => {
      const orderAmount = 100;
      const orderType = 'CAFE';
      const settings = {
        points_per_rupee: 1,
        cafe_bonus_percentage: 5
      };
      const result = calculateRewardPoints(orderAmount, orderType, settings);
      expect(result.basePoints).toBe(100);
      expect(result.bonusPoints).toBe(5);
      expect(result.totalPoints).toBe(105);
    });

    it('should calculate reward points correctly for FAST_FOOD order type', () => {
      const orderAmount = 100;
      const orderType = 'FAST_FOOD';
      const settings = {
        points_per_rupee: 1,
        fast_food_bonus_percentage: 15
      };
      const result = calculateRewardPoints(orderAmount, orderType, settings);
      expect(result.basePoints).toBe(100);
      expect(result.bonusPoints).toBe(15);
      expect(result.totalPoints).toBe(115);
    });
  });

  describe('calculateDiscountAmount', () => {
    it('should calculate discount amount correctly', () => {
      const points = 1000;
      const settings = {
        points_to_rupee_ratio: 100
      };
      const discountAmount = calculateDiscountAmount(points, settings);
      expect(discountAmount).toBe(10);
    });
  });
}); 