import { towers } from './main';

export function nearest_tower_requesting(creep) {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy;
    });
    return creep.findClosestByPath(requesting_towers);
}
export function tower_requesting() {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy;
    });
    return requesting_towers.length > 0;
}

export function tower_behavior(tower1) {
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