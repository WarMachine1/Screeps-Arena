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

export function check_creep_spawned(creep) {
  var result = true;
  var spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => i.my);
  spawns.forEach(spawn => {
      if(spawn.x === creep.x && spawn.y === creep.y) {
          result = false;
     }
  });
  return result;
}

function nearest_constructor_requesting(creep) {
  var requesting_constructors = constructors.filter(function (constructor) {
      return constructor.request_energy;
  });
  return creep.findClosestByPath(requesting_constructors, {costMatrix: support_cost_matrix});
}

function get_creep_cost(body_part_array) {
  var total = 0
  for(var body_part of body_part_array) {
      switch(body_part) {
          case MOVE:
              total += 50;
              break;

          case WORK:
              total += 100;
              break;
  
          case CARRY:
              total += 50;
              break;  

          case ATTACK:
              total += 80;
              break;

          case RANGED_ATTACK:
              total += 150;
              break;

          case HEAL:
              total += 250;
              break;

          case TOUGH:
              total += 10;
              break;
          
          default:
              break;
      }
  }
  return total
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
  return creep.findClosestByPath(requesting_towers, {costMatrix: support_cost_matrix});
}

function tower_requesting() {
  var requesting_towers = towers.filter(function (tower) {
      return tower.request_energy;
  });
  return requesting_towers.length > 0;
}