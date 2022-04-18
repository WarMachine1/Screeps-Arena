import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
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
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            var harvesters_tmp = [...harvesters];
            var closest_harvester = creep.findClosestByPath(harvesters_tmp, {costMatrix: support_cost_matrix});//find closest mover with more than half energy
            var closest_container = creep.findClosestByPath(containers, {costMatrix: support_cost_matrix});
            //console.log("Closest Container Location: (" + closest_container.x + "," + closest_container.y + ")")
            
            if(containers.length > 0) {
                if(creep.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest_container, {costMatrix: support_cost_matrix});
                    //creep.moveTo(closest_container);
                }
            } else if(sources.length > 0) {
                let found_harvester_needing_pickup = false;
                while(!found_harvester_needing_pickup&&harvesters_tmp.length>1) {
                    if(closest_harvester.store.getFreeCapacity(RESOURCE_ENERGY)>closest_harvester.store.getCapacity(RESOURCE_ENERGY)-creep.store.getCapacity(RESOURCE_ENERGY)) { //has less than mover capacity
                        for( var i = 0; i < harvesters.length; i++){     
                            if (harvesters_tmp[i] === closest_harvester) { 
                                harvesters_tmp.splice(i, 1); 
                            }
                            closest_harvester = creep.findClosestByPath(harvesters_tmp, {costMatrix: support_cost_matrix})
                        }
                    } else {
                        found_harvester_needing_pickup = true;
                    }
                }
                if(closest_harvester.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(closest_harvester, {costMatrix: support_cost_matrix});
                    // creep.moveTo(closest_harvester);
                }
            }
        } else if (tower_requesting()) {
            var target_tower = nearest_tower_requesting(creep);
            if(creep.transfer(target_tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target_tower, {costMatrix: support_cost_matrix});
                // creep.moveTo(target_tower);
            }
        } else if (constructor_requesting()) {
            var target_constructor = nearest_constructor_requesting(creep);
            if(creep.transfer(target_constructor, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target_constructor, {costMatrix: support_cost_matrix});
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
                if (creep.transfer(target_extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    //console.log("Moving: " + creep.moveTo(target_extension, {costMatrix: support_cost_matrix}));
                    creep.moveTo(target_extension, {costMatrix: support_cost_matrix});
                }
                //console.log("Delivering to Extension at " + target_extension.x + "," + target_extension.y);
            } else if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                //console.log("Delivering to Spawn");
                //console.log("Moving: " + creep.moveTo(spawn, {costMatrix: support_cost_matrix}));
                creep.moveTo(spawn, {costMatrix: support_cost_matrix});
            }
        }
    }
}