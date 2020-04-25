class Hand {
    static handValues = {
        "nothing": 0,
        "pair": 1,
        "twoPairs": 2,
        "three": 3,
        "straight": 4,
        "flush": 5,
        "full": 6,
        "quad": 7,
        "straightFlush": 8
    };

    static compareHands = handArray => {
        let currentBest = "nothing";
        let contenders = [];

        handArray.forEach(({hand, highest, player}) => {
            if (Hand.handValues[hand] < Hand.handValues[currentBest]) return;
            if (Hand.handValues[hand] > Hand.handValues[currentBest]) {
                currentBest = hand;
                contenders = [{hand, highest, player}];
                return;
            }
            contenders.push({highest, player})
        });

        if(contenders.length === 1) return contenders;
        currentBest = 0;
        let i = 0;
        while (contenders.length > 1 && i < contenders[0].highest.length) {
            let temp = [];
            contenders.forEach(contender => {
                if(contender.highest[i] > currentBest){
                    currentBest = contender.highest[i];
                    temp = [contender];
                }
                else if(contender.highest[i] === currentBest) temp.push(contender);
            })
            i++;
            contenders = temp;
        }
        return contenders;
    };

    constructor(values, colors, player) {
        this.player = player;
        const computed = this.compute(values, colors);
        this.hand = computed[0];
        this.highest = computed[1];
    }

    isStraight = (values) => {
        // Values should be sorted
        let streak = 1;
        for (let i = 1; i < values.length; ++i) {
            if (values[i] === values[i - 1] + 1) streak++;
            else if (streak === 5) return values[i - 1];
            else if (values.length - i >= 5) streak = 1;
            else return 0;
        }
        if (streak === 5) return values[values.length - 1];
        return 0;
    };

    compute = (values, colors) => {
        let haveFlush = null;
        Object.keys(colors).forEach(color => {
            if (colors[color].length >= 5) {
                haveFlush = colors[color];
            }
        });
        // If you have a flush, it's impossible to have something better at the same time, so we can return early
        if (haveFlush !== null) {
            const flushValues = haveFlush.map(({value}) => value).sort((a, b) => a - b);
            const isStraight = this.isStraight(flushValues);
            if (isStraight) return ["straightFlush", [isStraight]]; // Straight flush
            return ["flush", [flushValues[flushValues.length - 1]]]; // FLUSH
        }
        const valuesSorted = Object.keys(values).sort((a, b) => a - b).map(v => parseInt(v));
        const isStraight = this.isStraight(valuesSorted);
        if (isStraight) return ["straight", isStraight];
        const len = valuesSorted.length;
        let best3 = null;
        const best2 = [];
        const getBest = excluded => valuesSorted[len - 1] !== excluded ? valuesSorted[len - 1] : valuesSorted[len - 2];
        valuesSorted.forEach(value => {
            if (values[value] === 4) { // Quad
                return ["quad", [value, getBest(value)]];
            }
            if (values[value] === 3) { // Three of a kind
                best3 = value;
            }
            if (values[value] === 2) { // Pair
                best2.push(value);
            }
        });
        if (best3) {
            if (best2.length) { // Full
                return ["full", [best3, best2[best2.length - 1]]];
            }
            return ["three", [best3, getBest(best3)]];
        }
        if (best2.length >= 2) return ["twoPairs", [...best2.slice(best2.length - 2, best2.length), getBest(best2[best2.length - 1])]];
        if (best2.length === 1) return ["pair", [best2[0], getBest(best2[0])]];
        const bestCard = valuesSorted[valuesSorted.length - 1];
        return ["nothing", [bestCard, getBest(bestCard)]];
    };
}

module.exports = Hand;