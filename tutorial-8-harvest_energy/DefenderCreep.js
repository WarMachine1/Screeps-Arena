

export default class DefenderCreep extends GeneralCreep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var closestEnemy = this.creep_obj.findClosestByPath(enemy_creeps);
        if (closestEnemy && this.creep_obj.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
            this.creep_obj.moveTo(closestEnemy);
        }
        if(!closestEnemy) {
            this.creep_obj.moveTo(rally_point);
        }
    }

  }