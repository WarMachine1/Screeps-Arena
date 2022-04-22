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

export function enemy_armed_incursion() {
    
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

  var result = false;

  for(var e_armed_creep of enemy_armed_creeps) {
      if(spawn.x < 50 && e_armed_creep.x < 15) {
          result = true;
      }
      if(spawn.x > 50 && e_armed_creep.x > 85) {
          result = true;
      }
  }
  // console.log("Enemy Excursion: " + result);
  return result;
}

export function enemy_armed_excursion() {
    
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

  var result = false;

  for(var e_armed_creep of enemy_armed_creeps) {
      if(spawn.x < 50 && e_armed_creep.x < 85) {
          result = true;
      }
      if(spawn.x > 50 && e_armed_creep.x > 15) {
          result = true;
      }
  }
  // console.log("Enemy Excursion: " + result);
  return result;

}

export function nearest_buildable_tile(coords) {
  let result;
  let queue = [];
  let explored = [...Array(100)].map(e => Array(100).fill(false));
  // console.log("Nearest Buildable Tile ran on: " + JSON.stringify(coords));
  queue.push({x: coords["x"],y: coords["y"]});
  while(queue.length > 0) {
    let current_coord = queue.shift();
    if(getTerrainAt({ x: current_coord["x"], y: current_coord["y"] }) != 1) {
      if(check_for_structure(current_coord)) {
        result = {x: current_coord["x"], y: current_coord["y"], err: 1};
      } else {
        result = {x: current_coord["x"], y: current_coord["y"]};
      }
      break;
    }

    if(check_in_board(current_coord) && !explored[current_coord["x"]][current_coord["y"]]) {
      explored[current_coord["x"]][current_coord["y"]] = true;
      queue.push({x: current_coord["x"]+1,y: current_coord["y"]});
      queue.push({x: current_coord["x"]-1,y: current_coord["y"]});
      queue.push({x: current_coord["x"],y: current_coord["y"]+1});
      queue.push({x: current_coord["x"],y: current_coord["y"]-1});
    }
  }
  // console.log("Result of nearest buildable: " + JSON.stringify(result));
  return result;
}

function check_in_board(coord) {
  return coord["x"] >= 0 && coord["x"] < 100 && coord["y"] >= 0 && coord["y"] < 100;
}

export function check_for_structure(coords) {
  let result = false;
  var structures = utils.getObjectsByPrototype(Structure);
  for (var structure of structures) {
      if(structure.x == coords["x"] && structure.y == coords["y"]) {
        result = true;
      }
  }

  var construction_sites = utils.getObjectsByPrototype(ConstructionSite);
  for (var construction_site of construction_sites) {
    if(construction_site.x == coords["x"] && construction_site.y == coords["y"]) {
      result = true;
    }
  }
  // console.log("Structure at " + JSON.stringify(coords) + ": " + result);
  return result;
}

export function local_containers_empty() {
  let spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
  let containers = utils.getObjectsByPrototype(StructureContainer);
  for( var i = 0; i < containers.length; i++){
    // console.log("Used Capacity: " + containers[i].store.getUsedCapacity())
    if ( containers[i].store.getUsedCapacity() == 0) {
        containers.splice(i, 1);
        i--;
    }
  }
  let closest_container = spawn.findClosestByPath(containers, {costMatrix: support_cost_matrix});
  return getRange(spawn,closest_container) > 10;
}