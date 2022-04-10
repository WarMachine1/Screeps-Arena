import * as utils from '/game/utils';
import { text } from 'game/visual';
import { visual_debug } from './main';

export function generate_support_cost_matrix() {
    let cost = new CostMatrix;
    //console.log(cost)
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    if (spawn && spawn.x > 50) {
        cost.set(spawn.x - 1, spawn.y, 128);
        if (visual_debug) { text("x", { x: spawn.x - 1, y: spawn.y }, { color: "#ffff00" }); }
    } else if (spawn) {
        cost.set(spawn.x + 1, spawn.y, 128);
        if (visual_debug) { text("x", { x: spawn.x + 1, y: spawn.y }, { color: "#ffff00" }); }
    }
    var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
    for (var creep of creeps) {
        //console.log("Creep: " + creep.x + "," + creep.y);
        cost.set(creep.x, creep.y, 255);
        if (visual_debug) { text("x", { x: creep.x, y: creep.y }, { color: "#ff0000" }); }
    }

    var structures = utils.getObjectsByPrototype(Structure);
    for (var structure of structures) {
        //console.log("Structure: " + structure.x + "," + structure.y);
        cost.set(structure.x, structure.y, 255);
        if (visual_debug) { text("x", { x: structure.x, y: structure.y }, { color: "#ff0000" }); }
    }

    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);

    var enemy_eco_creeps = [];
    var enemy_armed_creeps = [];


    for (var e_creep of enemy_creeps) {
        if (!e_creep.body.some(bodyPart => bodyPart.type == ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK)) {
            enemy_eco_creeps.push(e_creep);
        } else {
            enemy_armed_creeps.push(e_creep);
        }
    }


    var exclusion_zone = 4;
    for (var e_armed_creep of enemy_armed_creeps) {
        for (let i = e_armed_creep.x - exclusion_zone; i <= e_armed_creep.x + exclusion_zone; i++) {
            for (let j = e_armed_creep.y - exclusion_zone; j <= e_armed_creep.y + exclusion_zone; j++) {
                if (i >= 0 && i < 100 && j >= 0 && j < 100) {
                    switch (getRange(e_armed_creep, { x: i, y: j })) {
                        case 0:
                            if (cost.get(i, j) < 230) {
                                cost.set(i, j, 230);
                                if (visual_debug) { text("x", { x: i, y: j }, { color: "#ff0000" }); }
                            }
                            break;

                        case 1:
                            if (cost.get(i, j) < 230) {
                                cost.set(i, j, 230);
                                if (visual_debug) { text("x", { x: i, y: j }, { color: "#ff0000" }); }
                            }
                            break;

                        case 2:
                            if (cost.get(i, j) < 150) {
                                cost.set(i, j, 150);
                                if (visual_debug) { text("x", { x: i, y: j }, { color: "#ff9900" }); }
                            }
                            break;

                        case 3:
                            if (cost.get(i, j) < 100) {
                                cost.set(i, j, 100);
                                if (visual_debug) { text("x", { x: i, y: j }, { color: "#ffff00" }); }
                            }
                            break;

                        case 4:
                            if (cost.get(i, j) < 70) {
                                cost.set(i, j, 70);
                                if (visual_debug) { text("x", { x: i, y: j }, { color: "#bbff00" }); }
                            }
                            break;

                        default:
                            break;
                    }
                }
            }
        }
    }

    return cost;
}
