class Card {
    static colors = ["heart", "diamond", "club", "spade"];

    constructor(value, color) {
        this.value = value;
        this.color = color;
    }

    serialize = () => {
        return [this.value, this.color];
    }
}

module.exports = Card;