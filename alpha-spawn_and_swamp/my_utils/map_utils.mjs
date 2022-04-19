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

export function nearest_buildable_tile(x, y) {

}