import * as prototypes from '/game/prototypes';
for (let globalKey in prototypes) { global[globalKey] = prototypes[globalKey];}

import * as constants from '/game/constants';
for (let globalKey in constants) { global[globalKey] = constants[globalKey];}

import * as specConstants from '/arena/constants';
for (let globalKey in specConstants) { global[globalKey] = specConstants[globalKey];}

import * as utils from '/game/utils';
for (let globalKey in utils) { global[globalKey] = utils[globalKey];}

import * as pathing from '/game/path-finder';
for (let globalKey in pathing) { global[globalKey] = pathing[globalKey];}

import * as arenaConstants from '/arena';
for (let globalKey in arenaConstants) { global[globalKey] = arenaConstants[globalKey];}

import { arenaInfo } from '/game';

var harvester = [MOVE,WORK,WORK,WORK,WORK,CARRY];
var mover = [MOVE,CARRY];
//var defender = [MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK];
var defender = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];
var harvester_limit = 2;
var mover_harvester_ratio = 1;
var defender_limit = 3;
const rally_point = {x:50,y:43};

export function loop() {
    
    
    var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my)
    var source = utils.getObjectsByPrototype(Source)[0];
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);

    const towers = utils.getObjectsByPrototype(StructureTower);

    //sort creeps
    var harvesters = [];
    var healers = [];
    var defenders = [];
    var archers = [];
    var movers = [];

    for(var creep of creeps) {
        if(check_creep_spawned(creep)) {
            if(creep.body.some(bodyPart => bodyPart.type == ATTACK)) {
                defenders.push(creep)
            } else if (creep.body.some(bodyPart => bodyPart.type == WORK)) {
                harvesters.push(creep)
            } else if (creep.body.some(bodyPart => bodyPart.type == HEAL)) {
                healers.push(creep)
            } else if (creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK)) {
                archers.push(creep)
            } else {
                movers.push(creep)
            }
        }
    }

    console.log("Harvesters: " + harvesters.length);

    

    for(var creep of harvesters) {
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else if (movers.length < 1) { //no movers
            if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        }
    }
    for(var creep of defenders) { //defender creep
        var closestEnemy = creep.findClosestByPath(enemy_creeps);
        if (closestEnemy && creep.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
            creep.moveTo(closestEnemy);
        }
        if(!closestEnemy) {
            creep.moveTo(rally_point);
        }
    }
    for(var creep of archers) { //ranged defender creep
            var closestEnemy = creep.findClosestByPath(enemy_creeps);
            creep.rangedAttack(closestEnemy);
            creep.moveTo(closestEnemy);
    }
    for(var creep of healers) { //healer creep
        var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
        if(myDamagedCreeps.length > 0) {
            if(creep.heal(myDamagedCreeps[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(myDamagedCreeps[0]);
            }
        }
    }

    for(var creep of movers) {
        
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
            var harvesters_tmp = [...harvesters];
            var closest_harvester = creep.findClosestByPath(harvesters_tmp);//find closest mover with more than half energy
            
            let found_harvester_needing_pickup = false;
            while(!found_harvester_needing_pickup&&harvesters_tmp.length>1) {
                if(closest_harvester.store.getFreeCapacity(RESOURCE_ENERGY)>closest_harvester.store.getCapacity(RESOURCE_ENERGY)-creep.store.getCapacity(RESOURCE_ENERGY)) { //has less than mover capacity
                    for( var i = 0; i < harvesters.length; i++){     
                        if (harvesters_tmp[i] === closest_harvester) { 
                            harvesters_tmp.splice(i, 1); 
                        }
                        closest_harvester = creep.findClosestByPath(harvesters_tmp)
                    }
                } else {
                    found_harvester_needing_pickup = true;
                }
            }
            
            if(closest_harvester.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closest_harvester);
            }
        } else {
            if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(spawn);
            }
        }
        // } else {
        //     const constructionSite = utils.getObjectsByPrototype(ConstructionSite).find(i => i.my);
        //     if(!constructionSite) {
        //         utils.createConstructionSite(spawn.x,spawn.y-3, StructureTower);
        //     } else {
        //         console.log("why am I here?");
        //         if(creep.build(constructionSite) == ERR_NOT_IN_RANGE) {
        //             creep.moveTo(constructionSite);
        //         }
        //     }
        // }
            
    }


    //tower
    if(towers.length>0) {
        const tower = utils.getObjectsByPrototype(StructureTower)[0];
        var targets = utils.getObjectsByPrototype(Creep).filter(creep => !creep.my);
        var target = utils.getObjectsByPrototype(Creep).find(creep => !creep.my);
        for(var targ of targets) {
            if(targ.body.some(bodyPart => bodyPart.type == HEAL)) {
                target = targ;
            }
        }
        tower.attack(target);
    }

    //spawning
    if (movers.length<harvesters.length*mover_harvester_ratio) {
        spawn.spawnCreep(mover).object;
    } else if (harvesters.length < harvester_limit) {
        spawn.spawnCreep(harvester).object;
    } else if (defenders.length < defender_limit) {
        spawn.spawnCreep(defender).object;
    }
}

function check_creep_spawned(creep) {
    var result = true;
    var spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => i.my);
    spawns.forEach(spawn => {
        if(spawn.x === creep.x && spawn.y === creep.y) {
            result = false;
       }
    });
    return result;
}

function get_distance(obj1, obj2){
    return Math.abs(obj1.X-obj2.X)+Math.abs(obj1.Y-obj2.Y);
}

function get_distance_to_nearest_source(obj) {
    var distance = Number.MAX_SAFE_INTEGER;
    var sources = utils.getObjectsByPrototype(Source);
    sources.forEach(source => {
        if(get_distance(obj, source) < distance) {
            distance = get_distance(obj, source);
        }
    });
    return distance;
}

function get_nearest_source(obj) {
    var distance = Number.MAX_SAFE_INTEGER;
    var source_result;
    var sources = utils.getObjectsByPrototype(Source);
    sources.forEach(source => {
        if(get_distance(obj, source) < distance) {
            distance = get_distance(obj, source);
            source_result = source;
        }
    });
    return source_result;
}