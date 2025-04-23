const calculateRewardPoints = (orderAmount, orderType, settings) => {
    // Calculate base points
    const basePoints = Math.floor(orderAmount * settings.points_per_rupee);
    let bonusPoints = 0;

    // Apply bonus based on order type
    switch (orderType) {
        case 'RESTAURANT':
            bonusPoints = Math.floor(basePoints * (settings.restaurant_bonus_percentage / 100));
            break;
        case 'CAFE':
            bonusPoints = Math.floor(basePoints * (settings.cafe_bonus_percentage / 100));
            break;
        case 'FAST_FOOD':
            bonusPoints = Math.floor(basePoints * (settings.fast_food_bonus_percentage / 100));
            break;
    }

    return {
        basePoints,
        bonusPoints,
        totalPoints: basePoints + bonusPoints
    };
};

const calculateDiscountAmount = (points, settings) => {
    return points / settings.points_to_rupee_ratio;
};

module.exports = {
    calculateRewardPoints,
    calculateDiscountAmount
}; 