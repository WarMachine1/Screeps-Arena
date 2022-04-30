import * as prototypes from '/game/prototypes';
for (let globalKey in prototypes) { global[globalKey] = prototypes[globalKey];}

import * as constants from '/game/constants';
for (let globalKey in constants) { global[globalKey] = constants[globalKey];}

import * as specConstants from '/arena/constants';
for (let globalKey in specConstants) { global[globalKey] = specConstants[globalKey];}

import * as utils from '/game/utils';
for (let globalKey in utils) { global[globalKey] = utils[globalKey];}

import * as pathing from '/game/path-finder';
for (let globalKey in pathing) { global[globalKey] = pathing[globalKey];}

import * as arenaConstants from '/arena';
for (let globalKey in arenaConstants) { global[globalKey] = arenaConstants[globalKey];}


import { arenaInfo } from '/game';

export function check_creep_spawned(creep) {
    var result = true;
    var spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => i.my);
    spawns.forEach(spawn => {
        if(spawn.x === creep.x && spawn.y === creep.y) {
            result = false;
        }
    });
    return result;
}

function get_creep_cost(body_part_array) {
    var total = 0
    for(var body_part of body_part_array) {
        total += BODYPART_COST[body_part];
    }
    return total;
}

function constructor_requesting() {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy;
    });
    return requesting_constructors.length > 0;
}

function tower_requesting() {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy;
    });
    return requesting_towers.length > 0;
}

// let example_body_comp = {WORK:100,MOVE:50,CARRY:50,ATTACK:80,RANGED_ATTACK:150,HEAL:250,TOUGH:10}

export function adaptive_spawner(body_comp, max_cost) {
    //console.log("Adaptive spawner: " + JSON.stringify(body_comp) + " Max Cost: " + max_cost);
    let cost = 0;
    let body_array = [];
    while(cost < max_cost) {
        let single_loop_cost = 0;
        for(let body_part in body_comp) {
            for(let i = 0; i < body_comp[body_part]; i++) {
                cost += BODYPART_COST[convert_to_bodypart_constant(body_part)];
                single_loop_cost += BODYPART_COST[convert_to_bodypart_constant(body_part)];
                if(cost > max_cost) {
                    return body_array;
                }
                body_array = body_array.concat(convert_to_bodypart_constant(body_part));
            }
        }
        if(max_cost - single_loop_cost < cost) {
            return body_array;
        }
    }
    return body_array;
}

function convert_to_bodypart_constant(bp){
    let result;
    switch(bp) {
        case "MOVE":
            result = [MOVE];
            break;

        case "WORK":
            result = [WORK];
            break;

        case "CARRY":
            result = [CARRY];
            break;

        case "ATTACK":
            result = [ATTACK];
            break;    
        
        case "RANGED_ATTACK":
            result = [RANGED_ATTACK];
            break;    
        
        case "HEAL":
            result = [HEAL];
            break;  
            
        case "TOUGH":
            result = [TOUGH];
            break;    
            
        default:
            break;
    }

    return result;
}