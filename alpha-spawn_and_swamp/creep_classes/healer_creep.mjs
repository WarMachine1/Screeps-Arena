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
        this.rush_time = 1300;
        this.support_cost_matrix;
        this.rally_point = {x:50,y:50};
        this.swarm_acheived = false;
        this.enemy_excursion = false;
        this.enemy_incursion = false;
    }

    behavior() {
        let spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        let creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        let myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);  
        // console.log("Number of defenders: " + this.get_number_of_defenders());
        // console.log("Enemy Excursion: " + this.enemy_excursion)
        if(myDamagedCreeps.length > 0) {
            // console.log("Proceeding to damaged creep");
            let closest_damaged_friendly = this.creep_obj.findClosestByRange(myDamagedCreeps, {costMatrix: this.support_cost_matrix});
            if(this.creep_obj.heal(closest_damaged_friendly) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(closest_damaged_friendly, {costMatrix: this.support_cost_matrix});
                this.creep_obj.rangedHeal(closest_damaged_friendly);
            }
        } else if (this.get_number_of_defenders() > 0 && (this.swarm_acheived || getTicks() >= this.rush_time || this.enemy_excursion)) { //defenders charging -> follow defenders
            // console.log("Following defenders");
            let target_defender = this.get_defender_closest_to_target();
            // console.log("Target Defender: " + JSON.stringify(target_defender));
            this.creep_obj.moveTo(target_defender.creep_obj, {costMatrix: this.support_cost_matrix});
        } else {
            // console.log("Heading to rally point")
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"], {costMatrix: this.support_cost_matrix});
        }
    }

    get_defender_closest_to_target() {
        //console.log("creep_list length: " + this.creeps_list.length);
        let defender_list = [];
        for(let creep of this.creeps_list) {
            // console.log("Creep: ");
            // for (let i in creep) {
            //     console.log(i + " : " + creep[i]);
            // }
            if(creep.status == "alive" && creep.constructor.name == "defender_creep") {
                defender_list.push(creep);
            }
        }

        defender_list.sort((a, b) => parseFloat(a.range_to_target) - parseFloat(b.range_to_target));

        //console.log("Constructors requesting energy: " + JSON.stringify(result));
        return defender_list[0]; 
    }

    get_number_of_defenders() {
        let result = 0;
        for(let creep of this.creeps_list) {
            //console.log("creep constructor name: " + creep.constructor.name);
            //console.log("Is requesting : " + creep.request_energy);
            if(creep.status == "alive" && creep.constructor.name == "defender_creep") {
                result += 1;
            }
        }
        return result;
    }

    update_data(variables) {
        if("var_creeps_list" in variables) {this.creeps_list = variables["var_creeps_list"]};
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
        if("var_rush_time" in variables) {this.rush_time = variables["var_rush_time"]};
        if("var_swarm_achieved" in variables) {this.swarm_acheived = variables["var_swarm_achieved"]};
        if("var_enemy_armed_excursion" in variables) {this.enemy_excursion = variables["var_enemy_armed_excursion"]};
        if("var_enemy_armed_incursion" in variables) {this.enemy_incursion = variables["var_enemy_armed_incursion"]};
    }

}