import { prototypes, utils, constants } from '/game';
import { MOVE, WORK, CARRY } from '/game/constants';
import { HarvesterCreep } from './HarvesterCreep';

var harvester = [MOVE,MOVE,WORK,CARRY];
var creeps = [];

export function loop() {
    //var creep = utils.getObjectsByPrototype(prototypes.Creep).find(i => i.my);
    // var creeps = utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my);
    //var source = utils.getObjectsByPrototype(prototypes.Source)[0];
    var spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);

    for(var creep of creeps) {
        creep.behavior();
    }

    console.log('Screeps:', utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length);

    if(utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my).length < 5) {
        var obj = spawn.spawnCreep(harvester);
        if(!obj.error) {
            creeps.push(new HarvesterCreep(obj.object));
        }
    }
    
}

