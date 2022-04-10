// To do:
// Increase mover limit once containers near base are depleted
// Find solution to protect movers collecting in the field
// Raider should actively avoid hostile armed creeps

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
import { generate_support_cost_matrix } from './support_cost_matrix_functions';

var harvester = [MOVE,WORK,WORK,WORK,WORK,CARRY];
var constructor = [MOVE,WORK,CARRY,MOVE,MOVE];
var mover = [CARRY,MOVE,MOVE];
//var defender = [MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK];
var defender = [TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE];
var raider = [RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL];
var healer = [HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE]
var harvester_limit = 0;
var mover_limit = 4;
var second_mover_limit = 15;
var constructor_limit = 1;
var raider_limit = 1;
var defender_limit = 500;
var healer_limit = 1;
var swarm_size = 4;
var swarm_acheived = false;
let rally_point = {x:5*flip_ext_locations,y:0};
const rally_point_2 = {x:0,y:-30};

var harvesters = [];
export var constructors = [];
var healers = [];
var defenders = [];
var raiders = [];
var archers = [];
var movers = [];
export var towers = [];
// var tower_locations = [{x:0,y:-3}];
var tower_locations = [];
var rampart_locations = [{x:0,y:0}];
var flip_ext_locations = 1;
var extension_locations = [{x:-2,y:-5},{x:0,y:-5},{x:2,y:-5}];
//var extension_locations = [];
var towerConstructionCount = 0;
var rampartConstructionCount = 0;
var extensionConstructionCount = 0;
var rush_time = 1300;
var support_cost_matrix = generate_support_cost_matrix();
export var visual_debug = false;

export function loop() {
    
    support_cost_matrix = generate_support_cost_matrix();
    
    var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my)
    var containers = utils.getObjectsByPrototype(StructureContainer);
    var sources = utils.getObjectsByPrototype(Source);
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    if(spawn.x > 50) {
        flip_ext_locations = -1;
    }
    rally_point = {x:5*flip_ext_locations,y:0};
    //extension_locations = [{x:5*flip_ext_locations,y:-2},{x:5*flip_ext_locations,y:-0},{x:5*flip_ext_locations,y:2}];

    // console.log("Constructor Limit: " + constructor_limit);
    // console.log("Tile 3: " + support_cost_matrix.get(spawn.x,spawn.y-3));

    // console.log("Terrains");
    // console.log(utils.getTerrainAt(8,1));
    // console.log(utils.getTerrainAt(6,1));

    towers = utils.getObjectsByPrototype(StructureTower);

    //sort creeps
    harvesters = [];
    constructors = [];
    healers = [];
    defenders = [];
    raiders = [];
    archers = [];
    movers = [];

    for( var i = 0; i < containers.length; i++){
        // console.log("Used Capacity: " + containers[i].store.getUsedCapacity())
        if ( containers[i].store.getUsedCapacity() == 0) {
            containers.splice(i, 1);
            i--;
        }
    }

    var closest_energy_container = spawn.findClosestByPath(containers);
    if (spawn && closest_energy_container && getRange(spawn,closest_energy_container) > 15) {
        mover_limit = second_mover_limit;
    }

    // console.log("Containers: ")
    // for( var container of containers) {
    //     console.log("Position: (" + container.x + "," + container.y + ")");
    // }

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

                case "raider":
                    raiders.push(creep)
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

    //check swarm
    if(defenders.length > swarm_size) {
        swarm_acheived = true;
    }

    if(defenders.length <= 1) {
        swarm_acheived = false;
    }
    

    for(var creep of harvesters) {
        harvester_behavior(creep);
    }

    for(var creep of constructors) {
        constructor_behavior(creep);
    }

    for(var creep of defenders) { //defender creep
        defender_behavior(creep);
    }

    for(var creep of raiders) { //raider creep
        raider_behavior(creep);
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

    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);

    var enemy_eco_creeps = [];
    var enemy_armed_creeps = [];

    for(var e_creep of enemy_creeps) {
        if(!e_creep.body.some(bodyPart => bodyPart.type == ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK)) {
            enemy_eco_creeps.push(e_creep);
        } else {
            enemy_armed_creeps.push(e_creep);
        }
    }

    //spawning
    if (movers.length<mover_limit) {
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
    } else if (raiders.length < raider_limit && enemy_eco_creeps.length > 4) {
        let ret = spawn.spawnCreep(raider);
        if(!ret.error) {
            ret.object.role = "raider";
            ret.object.activated = true;
        }
    } else if (healers.length < healer_limit && defenders.length > 3) {
        let ret = spawn.spawnCreep(healer);
        if(!ret.error) {
            ret.object.role = "healer";
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
            creep.moveTo(source, support_cost_matrix);
        }
    } else if (movers.length < 1) { //no movers
        if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(spawn, support_cost_matrix);
        }
    }
}

function constructor_behavior(creep) {
    var constructionSite = utils.getObjectsByPrototype(prototypes.ConstructionSite).find(i => i.my);
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    if(!constructionSite && rampartConstructionCount < rampart_locations.length) {
        utils.createConstructionSite(spawn.x+rampart_locations[rampartConstructionCount]["x"],spawn.y+rampart_locations[rampartConstructionCount]["y"], StructureRampart);
        rampartConstructionCount++;
    } else if(!constructionSite && towerConstructionCount < tower_locations.length) {
        utils.createConstructionSite(spawn.x+tower_locations[towerConstructionCount]["x"],spawn.y+tower_locations[towerConstructionCount]["y"], StructureTower);
        towerConstructionCount++;
    } else if(!constructionSite && extensionConstructionCount < extension_locations.length) {
        utils.createConstructionSite(spawn.x+extension_locations[extensionConstructionCount]["x"],spawn.y+extension_locations[extensionConstructionCount]["y"], StructureExtension);
        extensionConstructionCount++;
    } else if(!constructionSite && towerConstructionCount >= tower_locations.length && rampartConstructionCount >= rampart_locations.length && extensionConstructionCount >= extension_locations.length) {
        creep.request_energy = false;
        creep.role = "mover";
        constructor_limit = 0;
    } else {
        if(creep.build(constructionSite)==ERR_NOT_IN_RANGE) {
            creep.moveTo(constructionSite, support_cost_matrix)
        } else {
            creep.request_energy = true;
        }
    }
}

function defender_behavior(creep) {
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
    if (!swarm_acheived && getTicks() < rush_time && (!closestEnemyToSpawn || (closestEnemyToSpawn && getRange(spawn,closestEnemyToSpawn) > 20))) {
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

function raider_behavior(creep) {
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

    var closestEcoEnemy = creep.findClosestByPath(enemy_eco_creeps);
    var closestArmedEnemy = creep.findClosestByPath(enemy_armed_creeps);
    var closestEnemy = creep.findClosestByPath(enemy_creeps);
    var closestEnemySpawn = creep.findClosestByPath(enemy_spawns);
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
    // if(closestArmedEnemy && getRange(creep,closestArmedEnemy) < 3) {
    //     var direction = getDirection(closestArmedEnemy.x-creep.x,closestArmedEnemy.y-creep.y);
    //     if(direction > 4) {
    //         direction -= 4;
    //     } else {
    //         direction += 4;
    //     }
    //     creep.move(direction);
    // } else 
    // console.log("Tile 2: " + support_cost_matrix.get(spawn.x,spawn.y-2));
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
    creep.heal(creep)
}

function archer_behavior(creep) {
    var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
    var closestEnemy = creep.findClosestByPath(enemy_creeps);
    creep.rangedAttack(closestEnemy);
    creep.moveTo(closestEnemy);
}



function healer_behavior(creep) {
    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
    var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
    if(myDamagedCreeps.length > 0) {
        var closest_damaged_friendly = creep.findClosestByPath(myDamagedCreeps);
        if(creep.heal(closest_damaged_friendly) == ERR_NOT_IN_RANGE) {
            creep.moveTo(closest_damaged_friendly, {costMatrix: support_cost_matrix});
            creep.rangedHeal(closest_damaged_friendly);
        }
    } else {
        creep.moveTo(spawn.x + rally_point["x"],spawn.y + rally_point["y"], {costMatrix: support_cost_matrix});
    }
}

function mover_behavior(creep) {


    var containers = utils.getObjectsByPrototype(StructureContainer);
    var sources = utils.getObjectsByPrototype(Source);
    for( var i = 0; i < containers.length; i++){
        // console.log("Used Capacity: " + containers[i].store.getUsedCapacity())
        if ( containers[i].store.getUsedCapacity() == 0) {
            containers.splice(i, 1);
            i--;
        }
    }

    // console.log("Containers: ")
    // for( var container of containers) {
    //     console.log("Position: (" + container.x + "," + container.y + ")");
    // }

    var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
    var extensions = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my);
    if(creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
        var harvesters_tmp = [...harvesters];
        var closest_harvester = creep.findClosestByPath(harvesters_tmp);//find closest mover with more than half energy
        var closest_container = creep.findClosestByPath(containers);
        //console.log("Closest Container Location: (" + closest_container.x + "," + closest_container.y + ")")
        
        if(containers.length > 0) {
            if(creep.withdraw(closest_container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(closest_container, {costMatrix: support_cost_matrix});
                //creep.moveTo(closest_container);
            }
        } else if(sources.length > 0) {
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
                creep.moveTo(closest_harvester, {costMatrix: support_cost_matrix});
                // creep.moveTo(closest_harvester);
            }
        }
    } else if (tower_requesting()) {
        var target_tower = nearest_tower_requesting(creep);
        if(creep.transfer(target_tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target_tower, {costMatrix: support_cost_matrix});
            // creep.moveTo(target_tower);
        }
    } else if (constructor_requesting()) {
        var target_constructor = nearest_constructor_requesting(creep);
        if(creep.transfer(target_constructor, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target_constructor, {costMatrix: support_cost_matrix});
            // creep.moveTo(target_constructor);
        }
    } else {
        //console.log("Spawn Free Cap: " + spawn.store.getFreeCapacity(RESOURCE_ENERGY));
        if (spawn.store.getFreeCapacity(RESOURCE_ENERGY) <= 0 && extensions.length > 0) {
            
            var target_extension = extensions[0];
            for (var ex of extensions) {
                if (ex.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                    target_extension = ex;
                }
            }
            if (creep.transfer(target_extension, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                //console.log("Moving: " + creep.moveTo(target_extension, {costMatrix: support_cost_matrix}));
                creep.moveTo(target_extension, {costMatrix: support_cost_matrix});
            }
            //console.log("Delivering to Extension at " + target_extension.x + "," + target_extension.y);
        } else if(creep.transfer(spawn, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            //console.log("Delivering to Spawn");
            //console.log("Moving: " + creep.moveTo(spawn, {costMatrix: support_cost_matrix}));
            creep.moveTo(spawn, {costMatrix: support_cost_matrix});
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

function nearest_constructor_requesting(creep) {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy;
    });
    return creep.findClosestByPath(requesting_constructors);
}

function constructor_requesting() {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy;
    });
    return requesting_constructors.length > 0;
}

function nearest_tower_requesting(creep) {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy;
    });
    return creep.findClosestByPath(requesting_towers);
}

function tower_requesting() {
    var requesting_towers = towers.filter(function (tower) {
        return tower.request_energy;
    });
    return requesting_towers.length > 0;
}

