import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
        if(myDamagedCreeps.length > 0) {
            var closest_damaged_friendly = creep.findClosestByPath(myDamagedCreeps, {costMatrix: support_cost_matrix});
            if(creep.heal(closest_damaged_friendly) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closest_damaged_friendly, {costMatrix: support_cost_matrix});
                creep.rangedHeal(closest_damaged_friendly);
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
            creep.moveTo(spawn.x + rally_point["x"],spawn.y + rally_point["y"], {costMatrix: support_cost_matrix});
        }
    }

}