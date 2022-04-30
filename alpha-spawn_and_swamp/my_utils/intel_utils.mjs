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

export function enemy_majority_attack_parts() {
  let enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
  let melee_count = 0;
  let ranged_count = 0;
  for(let e_creep of enemy_creeps) {
    // console.log("Enemy Creep Body: " + JSON.stringify(e_creep.body));
    for(let bodypart of e_creep.body) {
      // console.log("Enemy Creep Body Part: " + JSON.stringify(bodypart));
      if(bodypart["type"] == "attack") {
        melee_count += 1;
      } else if (bodypart["type"] == "ranged_attack") {
        ranged_count += 1;
      }
    }
  }

  if(ranged_count > melee_count) {
    return "ranged";
  } else {
    return "melee";
  }

}