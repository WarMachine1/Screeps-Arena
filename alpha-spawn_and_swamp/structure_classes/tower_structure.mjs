import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        const tower = utils.getObjectsByPrototype(StructureTower)[0];
        var targets = utils.getObjectsByPrototype(Creep).filter(creep => !creep.my);
        var target = utils.getObjectsByPrototype(Creep).find(creep => !creep.my);
        for(var targ of targets) {
            if(targ.body.some(bodyPart => bodyPart.type == HEAL)) {
                target = targ;
            }
        }

        console.log("tower.request_energy: " + tower.request_energy);
        tower.attack(target);
        if(tower.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
            tower.request_energy = true;
        } else {
            tower.request_energy = false;
        }
    }

  }