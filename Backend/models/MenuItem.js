class MenuItem {
    constructor(name, description, price, category) {
        if (price < 0) {
            throw new Error('Menu item price cannot be negative');
        }
        
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }
}

module.exports = MenuItem; 