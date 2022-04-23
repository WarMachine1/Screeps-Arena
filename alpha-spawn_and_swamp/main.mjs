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




// var tower_locations = [{x:0,y:-3}];
var tower_locations = [];

let creeps_list = [];

let this_strategy = new strategy();
let this_construction_manager = new construction_manager();

export var support_cost_matrix = generate_support_cost_matrix();
export var visual_debug = false;

export function loop() {
    support_cost_matrix = generate_support_cost_matrix();

    creeps_list = this_strategy.get_creeps_list();
    this_strategy.update();
    update_creeps();
    this_construction_manager.update();
    
}

function update_creeps() {
    let update_variables = this_strategy.creep_data();
    update_variables["var_creeps_list"] = creeps_list;
    update_variables["var_support_cost_matrix"] = support_cost_matrix;
    for(let creep of creeps_list) {
        creep.update();
        creep.update_data(update_variables);
    }
}