import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);

        var enemy_eco_creeps = [];
        var enemy_armed_creeps = [];

        for(var e_creep of enemy_creeps) {
            if(!e_creep.body.some(bodyPart => bodyPart.type == ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == HEAL)) {
                enemy_eco_creeps.push(e_creep);
            } else {
                enemy_armed_creeps.push(e_creep);
            }
        }

        var target_creep;
        //find creeps within range 3 of the spawn, prioritize armed
        for(var e_armed_creep of enemy_armed_creeps) {
            if(getRange(spawn, e_armed_creep) <= 5) {
                target_creep = e_armed_creep;
            }
        }
        if(!target_creep) {
            for(var e_eco_creep of enemy_eco_creeps) {
                if(getRange(spawn, e_eco_creep) <= 5) {
                    target_creep = e_eco_creep;
                }
            }
        }

        if(target_creep) {
            if(creep.attack(target_creep) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target_creep);
            }
        } else {
            creep.moveTo({x: spawn.x+flip_locations*3, y: spawn.y});
        }
    }
}