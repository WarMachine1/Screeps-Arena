import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        var closestEnemy = creep.findClosestByPath(enemy_creeps);
        var closestEnemySpawn = creep.findClosestByPath(enemy_spawns);
        var closestEnemyToSpawn = spawn.findClosestByPath(enemy_creeps);

        //closest wounded creep
        var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
        var closestDamagedCreep = creep.findClosestByPath(myDamagedCreeps);
        // && (!closestEnemyToSpawn || (closestEnemyToSpawn && getRange(spawn,closestEnemyToSpawn) > 30)) 
        if (!swarm_acheived && getTicks() < rush_time && !enemy_armed_excursion()) {
            creep.moveTo(spawn.x + rally_point["x"],spawn.y + rally_point["y"]);
        } else if (closestEnemy && creep.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
            creep.moveTo(closestEnemy);
        } else if (!closestEnemy && closestEnemySpawn && creep.attack(closestEnemySpawn) == ERR_NOT_IN_RANGE) {
            creep.moveTo(closestEnemySpawn);
        } else  if (!closestEnemy && !closestEnemySpawn) {
            creep.moveTo(spawn.x + rally_point["x"],spawn.y + rally_point["y"]);
        }

        if(closestEnemy && getRange(creep,closestEnemy) > 1) {
            if(closestDamagedCreep && getRange(creep,closestDamagedCreep) > 1) {
                creep.rangedHeal(closestDamagedCreep);
            } else {
                creep.heal(closestDamagedCreep);
            }
        }
    }

  }