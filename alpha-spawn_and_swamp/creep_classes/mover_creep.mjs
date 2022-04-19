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

import { support_cost_matrix } from '../main.mjs';

export class mover_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
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
        if(this.creep_obj.store.getFreeCapacity(RESOURCE_ENERGY)) {
            var closest_container = this.creep_obj.findClosestByPath(containers, {costMatrix: support_cost_matrix});
            //console.log("Closest Container Location: (" + closest_container.x + "," + closest_container.y + ")")
            
            if(containers.length > 0) {
                if(this.creep_obj.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(closest_container, {costMatrix: support_cost_matrix});
                    //creep.moveTo(closest_container);
                }
            }
        /*} else if (tower_requesting()) {
            var target_tower = nearest_tower_requesting(this.creep_obj);
            if(this.creep_obj.transfer(target_tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(target_tower, {costMatrix: support_cost_matrix});
                // creep.moveTo(target_tower);
            }
        } else if (constructor_requesting()) {
            var target_constructor = nearest_constructor_requesting(creep);
            if(this.creep_obj.transfer(target_constructor, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep_obj.moveTo(target_constructor, {costMatrix: support_cost_matrix});
                // creep.moveTo(target_constructor);
            }
        } else {
            //console.log("Spawn Free Cap: " + spawn.store.getFreeCapacity(RESOURCE_ENERGY));
            if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) <= 0 && extensions.length > 0) {
                
                var target_extension = extensions[0];
                for (var ex of extensions) {
                    if (ex.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                        target_extension = ex;
                    }
                }
                if (this.creep_obj.transfer(target_extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(target_extension, {costMatrix: support_cost_matrix});
                }
                //console.log("Delivering to Extension at " + target_extension.x + "," + target_extension.y); */
        } else if(this.creep_obj.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            
            this.creep_obj.moveTo(spawn, {costMatrix: support_cost_matrix});
        }
    }
}