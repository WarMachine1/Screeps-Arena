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

import { general_creep } from './general_creep'

export class mover_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.creeps_list = [];
        this.support_cost_matrix;
    }

    behavior() {

        var containers = utils.getObjectsByPrototype(StructureContainer);
        var sources = utils.getObjectsByPrototype(Source);
        for( var i = 0; i < containers.length; i++){
            // console.log("Used Capacity: " + containers[i].store.getUsedCapacity())
            if ( containers[i].store.getUsedCapacity() == 0) {
                containers.splice(i, 1);
                i--;
            }
        }

        // console.log("Containers: ")
        // for( var container of containers) {
        //     console.log("Position: (" + container.x + "," + container.y + ")");
        // }

        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        var extensions = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my);
        let requesting_constructors = this.constructors_requesting_energy();
        var closest_container = this.creep_obj.findClosestByRange(containers, {costMatrix: this.support_cost_matrix, swampCost: 2});
        if(this.creep_obj.store.getUsedCapacity(RESOURCE_ENERGY) <= 0 && containers.length > 0 && this.creep_obj.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.creep_obj.moveTo(closest_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
        } else if (requesting_constructors.length > 0) {
            let requesting_constructor_creeps = requesting_constructors.map(a => a.creep_obj)
            let target_constructor = this.creep_obj.findClosestByRange(requesting_constructor_creeps, {costMatrix: this.support_cost_matrix, swampCost: 2});
            if(this.creep_obj.transfer(target_constructor, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(target_constructor, {costMatrix: this.support_cost_matrix, swampCost: 2});
            } else if (closest_container) {
                this.creep_obj.moveTo(closest_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
            }
        } else {
            //drop off at closest extension or spawn with capacity
            let production_not_full = [];
            
            if(extensions.length > 0) {
                for(let ext of extensions) {
                    if(ext.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        production_not_full.push(ext);
                    }
                }
            }

            if(spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                production_not_full.push(spawn);
            }

            let closest_production_not_full = this.creep_obj.findClosestByRange(production_not_full);

            if (this.creep_obj.transfer(closest_production_not_full, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(closest_production_not_full, {costMatrix: this.support_cost_matrix, swampCost: 2});
            } else if (closest_container) {
                this.creep_obj.moveTo(closest_container, {costMatrix: this.support_cost_matrix, swampCost: 2});
            }
        }
    }

    update_data(variables) {
        if("var_creeps_list" in variables) {this.creeps_list = variables["var_creeps_list"]};
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
    }

    constructors_requesting_energy() {
        let result  = [];
        //console.log("creep_list length: " + this.creeps_list.length);
        for(let creep of this.creeps_list) {
            //console.log("creep constructor name: " + creep.constructor.name);
            //console.log("Is requesting : " + creep.request_energy);
            if(creep.constructor.name == "constructor_creep" && creep.request_energy) {
                result.push(creep);
            }
        }
        //console.log("Constructors requesting energy: " + JSON.stringify(result));
        return result;
    }
}