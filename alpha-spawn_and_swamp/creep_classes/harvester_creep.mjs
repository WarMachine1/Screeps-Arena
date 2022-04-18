import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var source = utils.getObjectsByPrototype(Source)[0];
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source, {costMatrix: support_cost_matrix});
            }
        } else if (movers.length < 1) { //no movers
            if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn, {costMatrix: support_cost_matrix});
            }
        }
    }

  }