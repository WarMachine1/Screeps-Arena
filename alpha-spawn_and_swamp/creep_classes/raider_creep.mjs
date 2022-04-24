import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
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

        var closestEcoEnemy = creep.findClosestByRange(enemy_eco_creeps, {costMatrix: support_cost_matrix});
        var closestEnemy = creep.findClosestByRange(enemy_creeps);
        var closestEnemySpawn = creep.findClosestByRange(enemy_spawns, {costMatrix: support_cost_matrix});
        var creeps_d = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        var defenders_d = [];

        for(var creep_d of creeps_d) {
            if(check_creep_spawned(creep_d)) {
                switch(creep_d.role) {
                    case "defender":
                        defenders_d.push(creep_d)
                        break;

                    default:
                        break;
                }
            }
        }

        if(defenders_d.length > 0 || getTicks() > rush_time) {
            creep.activated = true;
        }

        if (!creep.activated) {
            creep.moveTo(spawn.x+rally_point_2["x"],spawn.y+rally_point_2["y"], [support_cost_matrix], {costMatrix: support_cost_matrix});
        } else if (closestEcoEnemy) {
            if(creep.rangedAttack(closestEcoEnemy)== ERR_NOT_IN_RANGE) {
                creep.rangedAttack(closestEnemy);
            }
            creep.moveTo(closestEcoEnemy, {costMatrix: support_cost_matrix});
        } else if (!closestEcoEnemy && closestEnemySpawn) {
            if(creep.rangedAttack(closestEnemySpawn)== ERR_NOT_IN_RANGE) {
                creep.rangedAttack(closestEnemy);
            }
            creep.moveTo(closestEnemySpawn, {costMatrix: support_cost_matrix});
        } else  if (!closestEcoEnemy && !closestEnemySpawn) {
            creep.moveTo(spawn.x+rally_point_2["x"],spawn.y+rally_point_2["y"], {costMatrix: support_cost_matrix});
        }
        creep.heal(creep);
    }
}