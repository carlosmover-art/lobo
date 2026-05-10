// combat.js - Combat Logic and Tables

// Project Aon Standard Combat Results Table
// Columns correspond to random numbers 0-9. (0 is usually treated as 0 in Lone Wolf, sometimes 10, but standard Aon table uses 0-9 directly)
// Note: In Lone Wolf, random number 0 is 0 in the combat table (in the books it's written 1 to 0 where 0=0).
const combatTable = {
    "-11": [{e:0,ls:"k"}, {e:0,ls:"k"}, {e:0,ls:8}, {e:0,ls:8}, {e:1,ls:7}, {e:2,ls:6}, {e:3,ls:5}, {e:4,ls:4}, {e:5,ls:3}, {e:6,ls:0}],
    "-9":  [{e:0,ls:"k"}, {e:0,ls:8}, {e:0,ls:7}, {e:1,ls:7}, {e:2,ls:6}, {e:3,ls:6}, {e:4,ls:5}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:0}],
    "-7":  [{e:0,ls:8}, {e:0,ls:7}, {e:1,ls:6}, {e:2,ls:6}, {e:3,ls:5}, {e:4,ls:5}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:2}, {e:8,ls:0}],
    "-5":  [{e:0,ls:6}, {e:1,ls:6}, {e:2,ls:5}, {e:3,ls:5}, {e:4,ls:4}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:2}, {e:8,ls:0}, {e:9,ls:0}],
    "-3":  [{e:1,ls:6}, {e:2,ls:5}, {e:3,ls:5}, {e:4,ls:4}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:2}, {e:8,ls:1}, {e:9,ls:0}, {e:10,ls:0}],
    "-1":  [{e:2,ls:5}, {e:3,ls:5}, {e:4,ls:4}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:2}, {e:8,ls:2}, {e:9,ls:1}, {e:10,ls:0}, {e:11,ls:0}],
    "0":   [{e:3,ls:5}, {e:4,ls:4}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:2}, {e:8,ls:2}, {e:9,ls:1}, {e:10,ls:0}, {e:11,ls:0}, {e:12,ls:0}],
    "1":   [{e:4,ls:5}, {e:5,ls:4}, {e:6,ls:3}, {e:7,ls:3}, {e:8,ls:2}, {e:9,ls:2}, {e:10,ls:1}, {e:11,ls:0}, {e:12,ls:0}, {e:14,ls:0}],
    "3":   [{e:5,ls:4}, {e:6,ls:3}, {e:7,ls:3}, {e:8,ls:2}, {e:9,ls:2}, {e:10,ls:2}, {e:11,ls:1}, {e:12,ls:0}, {e:14,ls:0}, {e:16,ls:0}],
    "5":   [{e:6,ls:4}, {e:7,ls:3}, {e:8,ls:3}, {e:9,ls:2}, {e:10,ls:2}, {e:11,ls:1}, {e:12,ls:0}, {e:14,ls:0}, {e:16,ls:0}, {e:18,ls:0}],
    "7":   [{e:7,ls:4}, {e:8,ls:3}, {e:9,ls:2}, {e:10,ls:2}, {e:11,ls:2}, {e:12,ls:2}, {e:14,ls:0}, {e:16,ls:0}, {e:18,ls:0}, {e:"k",ls:0}],
    "9":   [{e:8,ls:3}, {e:9,ls:3}, {e:10,ls:2}, {e:11,ls:2}, {e:12,ls:2}, {e:14,ls:1}, {e:16,ls:0}, {e:18,ls:0}, {e:"k",ls:0}, {e:"k",ls:0}],
    "11":  [{e:9,ls:0}, {e:10,ls:0}, {e:11,ls:0}, {e:12,ls:0}, {e:14,ls:0}, {e:16,ls:0}, {e:18,ls:0}, {e:"k",ls:0}, {e:"k",ls:0}, {e:"k",ls:0}]
};

function getCombatColumn(ratio) {
    if (ratio <= -11) return "-11";
    if (ratio >= -10 && ratio <= -9) return "-9";
    if (ratio >= -8 && ratio <= -7) return "-7";
    if (ratio >= -6 && ratio <= -5) return "-5";
    if (ratio >= -4 && ratio <= -3) return "-3";
    if (ratio >= -2 && ratio <= -1) return "-1";
    if (ratio === 0) return "0";
    if (ratio >= 1 && ratio <= 2) return "1";
    if (ratio >= 3 && ratio <= 4) return "3";
    if (ratio >= 5 && ratio <= 6) return "5";
    if (ratio >= 7 && ratio <= 8) return "7";
    if (ratio >= 9 && ratio <= 10) return "9";
    if (ratio >= 11) return "11";
    return "0";
}

function resolveCombatRound(ratio, randomNum) {
    // Lone wolf random uses 0 as 0 and 1-9 as 1-9 in the table index (0 to 9 index)
    // Actually, in the book random table: 0 is usually 0. Let's assume randomNum is 0-9 directly mapping to array index 0-9.
    // However, some versions treat 0 as 10. For the array index, we'll map randomNum 0 to index 9, and 1-9 to index 0-8.
    // Standard rule: 1=idx0, 2=idx1... 9=idx8, 0=idx9
    let idx = randomNum === 0 ? 9 : randomNum - 1;
    
    const column = getCombatColumn(ratio);
    const result = combatTable[column][idx];
    
    return result; // {e: num/"k", ls: num/"k"}
}
