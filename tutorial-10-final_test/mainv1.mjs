import { } from '/game/utils';
import { } from '/game/prototypes';
import { } from '/game/constants';
import { } from '/arena';
import { prototypes, utils, constants } from '/game';
import { MOVE, WORK, CARRY, ATTACK, HEAL, RANGED_ATTACK } from '/game/constants';
import { createConstructionSite } from '/game/utils';
import { StructureTower } from '/game/prototypes';
import { RESOURCE_ENERGY, ERR_NOT_IN_RANGE } from '/game/constants';

var harvester = [MOVE,WORK,WORK,WORK,WORK,CARRY];
var mover = [MOVE,CARRY];
//var defender = [MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK];
var defender = [MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK];
var harvester_limit = 3;
var defender_limit = 10;

export function loop() {
    
    
    var creeps = utils.getObjectsByPrototype(prototypes.Creep).filter(i => i.my);
    var enemy_creeps = utils.getObjectsByPrototype(prototypes.Creep).filter(i => !i.my)
    var source = utils.getObjectsByPrototype(prototypes.Source)[0];
    var spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    const towers = utils.getObjectsByPrototype(prototypes.StructureTower);

    //count harvesters, movers and defenders
    var harvesters = 0;
    var defenders = 0;
    var movers = 0;

    for(var creep of creeps) {
        if(creep.body.some(bodyPart => bodyPart.type == ATTACK)) {
            defenders++;
        } else if (creep.body.some(bodyPart => bodyPart.type == WORK)) {
            harvesters++;
        } else {
            movers++;
        }
    }

    console.log('defenders:', defenders);
    console.log('harvesters:', harvesters);

    for(var creep of creeps) {
        if(creep.body.some(bodyPart => bodyPart.type == WORK)) { //harvester creep
            if(creep.store.getFreeCapacity(constants.RESOURCE_ENERGY)) {
                if(creep.harvest(source) == constants.ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            } else {
                if(defenders < defender_limit || harvesters < harvester_limit) {
                    if(creep.transfer(spawn, constants.RESOURCE_ENERGY) == constants.ERR_NOT_IN_RANGE) {
                        creep.moveTo(spawn);
                    }
                } else {
                    if(towers.length===0) { //tower incomplete
                        const constructionSite = utils.getObjectsByPrototype(prototypes.ConstructionSite).find(i => i.my);
                        if(!constructionSite) {
                            utils.createConstructionSite(51,46, prototypes.StructureTower);
                        } else {
                            if(creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(constructionSite);
                            }
                        }
                    } else { //tower built
                        const tower = utils.getObjectsByPrototype(prototypes.StructureTower)[0];
                        if(creep.transfer(tower, constants.RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(tower)
                        }
                    }
                }
            }
        } else if (creep.body.some(bodyPart => bodyPart.type == ATTACK)) { //defender creep
            var closestEnemy = creep.findClosestByPath(enemy_creeps);
            if (creep.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closestEnemy);
            }
        } else if (creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK)) { //ranged defender creep
            var closestEnemy = creep.findClosestByPath(enemy_creeps);
            // if (creep.rangedAttack(closestEnemy) == ERR_NOT_IN_RANGE) {
            //     creep.moveTo(closestEnemy);
            // }
            creep.rangedAttack(closestEnemy);
            creep.moveTo(closestEnemy);
        } else if(creep.body.some(bodyPart => bodyPart.type == HEAL)) { //healer creep
            var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
            if(myDamagedCreeps.length > 0) {
                if(creep.heal(myDamagedCreeps[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(myDamagedCreeps[0]);
                }
            }
        } else { //mover creep

        }
    }

    //tower
    if(towers.length>0) {
        const tower = utils.getObjectsByPrototype(prototypes.StructureTower)[0];
        var targets = utils.getObjectsByPrototype(prototypes.Creep).filter(creep => !creep.my);
        var target = utils.getObjectsByPrototype(prototypes.Creep).find(creep => !creep.my);
        for(var targ of targets) {
            if(targ.body.some(bodyPart => bodyPart.type == HEAL)) {
                target = targ;
            }
        }
        tower.attack(target);
    }


    //spawning
    if(harvesters < harvester_limit) {
        spawn.spawnCreep(harvester).object
    } else if(defenders < defender_limit){
        spawn.spawnCreep(defender).object
    }
}
