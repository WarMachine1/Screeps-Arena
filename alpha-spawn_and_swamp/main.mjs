// To do:
// Increase mover limit once containers near base are depleted
// Find solution to protect movers collecting in the field
// Raider should actively avoid hostile armed creeps

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

import { mover_creep } from './creep_classes/mover_creep.mjs'
import { generate_support_cost_matrix } from './generate_support_cost_matrix';

var harvester = [MOVE,WORK,WORK,WORK,WORK,CARRY];
var constructor = [MOVE,WORK,CARRY,MOVE,MOVE];
var mover = [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE];
// var defender = [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK];
var defender = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE];
var minuteman = [TOUGH,TOUGH,TOUGH,TOUGH,ATTACK,ATTACK,MOVE]
var raider = [RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL];
var healer = [HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE]



// var tower_locations = [{x:0,y:-3}];
var tower_locations = [];

let creeps = [];

export var support_cost_matrix = generate_support_cost_matrix();
export var visual_debug = false;

export function loop() {

    let test_list = {mover:5,defender:3};

    console.log("Test: " + test_list["mover"]);

    
    support_cost_matrix = generate_support_cost_matrix();
    
    update_creeps();

    //spawn_per_strategy();

    var spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);

    for(var creep of creeps) {
        creep.update();
    }

    console.log('Screeps:', utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length);

    if(utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length < 5) {
        var obj = spawn.spawnCreep(mover);
        if(!obj.error) {
            creeps.push(new mover_creep(obj.object));
        }
    }
}

function update_creeps() {
    for(let creep of creeps) {
        creep.update();
    }
}

