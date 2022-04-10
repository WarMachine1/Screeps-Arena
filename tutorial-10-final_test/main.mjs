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
var constructor = [MOVE,WORK,WORK,WORK,CARRY];
var mover = [MOVE,CARRY];
//var defender = [MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK];
var defender = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];
var harvester_limit = 2;
var mover_harvester_ratio = 1;
var constructor_limit = 1;
var defender_limit = 3;
const rally_point = {x:50,y:43};

var harvesters = [];
var constructors = [];
var healers = [];
var defenders = [];
var archers = [];
var movers = [];
var towers = [];
var tower_locations = [{x:0,y:-3},{x:-4,y:0}]
var constructionCount = 0;

export function loop() {
    
    
    var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my)
    var source = utils.getObjectsByPrototype(Source)[0];
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);

    console.log("Terrains");
    console.log(utils.getTerrainAt(8,1));
    console.log(utils.getTerrainAt(6,1));

    towers = utils.getObjectsByPrototype(StructureTower);

    //sort creeps
    harvesters = [];
    constructors = [];
    healers = [];
    defenders = [];
    archers = [];
    movers = [];

    // console.log("total my creeps: " + creeps.length);  

    for(var creep of creeps) {
        if(check_creep_spawned(creep)) {
            switch(creep.role) {
                case "defender":
                    defenders.push(creep)
                    break;

                case "harvester":
                    harvesters.push(creep)
                    break;
                
                case "constructor":
                    constructors.push(creep)
                    break;

                case "healer":
                    healers.push(creep)
                    break;

                case "archer":
                    archers.push(creep)
                    break;

                case "mover":
                    movers.push(creep)
                    break;

                default:
                    break;
            }
        }
    }

    // console.log("Harvesters: " + harvesters.length);
    // console.log("Movers: " + movers.length);
    // console.log("Defenders: " + defenders.length);

    

    for(var creep of harvesters) {
        harvester_behavior(creep);
    }

    for(var creep of constructors) {
        constructor_behavior(creep);
    }

    for(var creep of defenders) { //defender creep
        defender_behavior(creep);
    }

    for(var creep of archers) { //ranged defender creep
        archer_behavior(creep);
    }

    for(var creep of healers) { //healer creep
        healer_behavior(creep);
    }

    for(var creep of movers) {
        mover_behavior(creep);
    }


    //tower
    for(var tower in towers) {
        tower_behavior(tower);
    }

    //spawning
    if (movers.length<harvesters.length*mover_harvester_ratio) {
        let ret = spawn.spawnCreep(mover);
        if(!ret.error) {
            ret.object.role = "mover";
        }
    } else if (harvesters.length < harvester_limit) {
        let ret = spawn.spawnCreep(harvester);
        if(!ret.error) {
            ret.object.role = "harvester";
        }
    } else if (constructors.length < constructor_limit) {
        let ret = spawn.spawnCreep(constructor);
        if(!ret.error) {
            ret.object.role = "constructor";
            ret.object.request_energy = false;
        }
    } else if (defenders.length < defender_limit) {
        let ret = spawn.spawnCreep(defender);
        if(!ret.error) {
            ret.object.role = "defender";
        }
    }
}

function harvester_behavior(creep) {
    var source = utils.getObjectsByPrototype(Source)[0];
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
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

function constructor_behavior(creep) {
    var constructionSite = utils.getObjectsByPrototype(prototypes.ConstructionSite).find(i => i.my);
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    console.log("construction count: " + constructionCount);
    console.log("tower locations: " + tower_locations.length);
    if(!constructionSite && constructionCount < tower_locations.length) {
        utils.createConstructionSite(spawn.x+tower_locations[constructionCount]["x"],spawn.y+tower_locations[constructionCount]["y"], StructureTower);
        constructionCount++;
    } else {
        if(creep.build(constructionSite)==ERR_NOT_IN_RANGE) {
            creep.moveTo(constructionSite)
        } else {
            creep.request_energy = true;
        }
    }
}

function defender_behavior(creep) {
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
    var closestEnemy = creep.findClosestByPath(enemy_creeps);
    if (closestEnemy && creep.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
        creep.moveTo(closestEnemy);
    }
    if(!closestEnemy) {
        creep.moveTo(rally_point);
    }
}

function archer_behavior(creep) {
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
    var closestEnemy = creep.findClosestByPath(enemy_creeps);
    creep.rangedAttack(closestEnemy);
    creep.moveTo(closestEnemy);
}



function healer_behavior(creep) {
    var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
    if(myDamagedCreeps.length > 0) {
        if(creep.heal(myDamagedCreeps[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(myDamagedCreeps[0]);
        }
    }
}

function mover_behavior(creep) {
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
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
    } else if (tower_requesting()) {
        var target_tower = nearest_tower_requesting(creep);
        if(creep.transfer(target_tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target_tower);
        }
    } else if (constructor_requesting()) {
        var target_constructor = nearest_constructor_requesting(creep);
        if(creep.transfer(target_constructor, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target_constructor);
        }
    } else {
        if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn);
        }
    }
}

function tower_behavior(tower1) {
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

function nearest_constructor_requesting(creep) {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy
      });
    return creep.findClosestByPath(requesting_constructors);
}

function constructor_requesting() {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy
    });
    return requesting_constructors.length > 0;
}

function nearest_tower_requesting(creep) {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy
      });
    return creep.findClosestByPath(requesting_towers);
}

function tower_requesting() {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy
    });
    return requesting_towers.length > 0;
}