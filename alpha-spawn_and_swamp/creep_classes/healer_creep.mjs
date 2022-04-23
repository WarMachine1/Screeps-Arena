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

import { general_creep } from './general_creep'

export class healer_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.creeps_list = [];
        this.support_cost_matrix;
        this.rally_point = {x:50,y:50};
    }

    behavior() {
        let spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        let creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        let myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
        if(myDamagedCreeps.length > 0) {
            let closest_damaged_friendly = this.creep_obj.findClosestByPath(myDamagedCreeps, {costMatrix: this.support_cost_matrix});
            if(this.creep_obj.heal(closest_damaged_friendly) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(closest_damaged_friendly, {costMatrix: this.support_cost_matrix});
                this.creep_obj.rangedHeal(closest_damaged_friendly);
            }
        } else if (defenders.length > 0 && !(!swarm_acheived && getTicks() < rush_time && !enemy_armed_excursion())) { //defenders charging -> follow defenders
            var furthest_defender = defenders[0];
            var current_range = 0;
            for(var d of defender) {
                var range = getRange(d,spawn);
                if (getRange(d,spawn) > range) {
                    furthest_defender = d;
                    current_range = range;
                }
            }
            creep.moveTo(furthest_defender, {costMatrix: support_cost_matrix});
        } else {
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"], {costMatrix: this.support_cost_matrix});
        }
    }

    update_data(variables) {
        if("var_creeps_list" in variables) {this.creeps_list = variables["var_creeps_list"]};
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
    }

    get_defender_closest_to_target() {
        
    }

}