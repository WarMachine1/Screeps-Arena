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

//import { text } from 'game/visual';

import { arenaInfo } from '/game';

//import { mover_creep } from './creep_classes/mover_creep.mjs'

import { general_creep } from './creep_classes/general_creep.mjs';

import { strategy } from './my_utils/strategy.mjs';
import { generate_support_cost_matrix } from './generate_support_cost_matrix.mjs';
import { construction_manager } from './my_utils/construction_manager.mjs';
import { logger } from './my_utils/logger.mjs';




// var tower_locations = [{x:0,y:-3}];
var tower_locations = [];

let creeps_list = [];

let this_strategy = new strategy();
let this_construction_manager = new construction_manager();
let this_logger = new logger();


export var support_cost_matrix = generate_support_cost_matrix();
export var visual_debug = false;

/*
TO DO:
-Constructor container extension construction behavior per https://arenainsights.net/link-game/CXZIQDRJSW
-Mover flee behavior
-constructor flee behavior
-contingencies for target container decaying in all states (in case constructor movement hampered or forced to flee)

*/
export function loop() {
    if(getTicks() < 2) {
        let spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        utils.createConstructionSite(spawn.x,spawn.y, StructureRampart);
    } else {

        support_cost_matrix = generate_support_cost_matrix();

        creeps_list = this_strategy.get_creeps_list();
        this_strategy.update();
        this_logger.update();
        update_creeps();
        this_construction_manager.update();
    }
    
}

function update_creeps() {
    let strat_update_variables = this_strategy.creep_data();
    let construction_update_variables = this_construction_manager.creep_data();
    let update_variables = {...strat_update_variables,...construction_update_variables};
    update_variables["var_creeps_list"] = creeps_list;
    update_variables["var_support_cost_matrix"] = support_cost_matrix;
    for(let creep of creeps_list) {
        creep.update();
        creep.update_data(update_variables);
    }
}