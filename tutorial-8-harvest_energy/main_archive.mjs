import { prototypes, utils, constants } from '/game';
import { MOVE, WORK, CARRY } from '/game/constants';

export function loop() {
    //var creep = utils.getObjectsByPrototype(prototypes.Creep).find(i => i.my);
    var creeps = utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my);
    var source = utils.getObjectsByPrototype(prototypes.Source)[0];
    var spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);

    for(var creep of creeps) {
        if(creep.store.getFreeCapacity(constants.RESOURCE_ENERGY)) {
            if(creep.harvest(source) == constants.ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else {
            if(creep.transfer(spawn, constants.RESOURCE_ENERGY) == constants.ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        }
    }

    console.log('Screeps:', utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length);

    if(utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length < 5) {
        spawn.spawnCreep([MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY]).object
    }
}