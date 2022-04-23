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

import { support_cost_matrix } from '../main.mjs';

import { arenaInfo } from '/game';

export class general_creep {
  constructor(creep_object) {
    this.creep_obj = creep_object;
    this.status = "spawning";
  }

  update() {
    this.update_status();
    if(this.status != "alive") {return;}
    this.behavior();
  }

  behavior() {

  }

  update_data(variables) {

  }

  update_status() {
    if(this.overlapping_spawn()) {
      this.status = "spawning";
    } else if (this.creep_obj.hits) {
      this.status = "alive";
    } else {
      this.status = "dead";
    }
  }

  get_status() {
    return this.status;
  }

  overlapping_spawn() {
    var result = false;
    var spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => i.my);
    spawns.forEach(spawn => {
        if(spawn.x === this.creep_obj.x && spawn.y === this.creep_obj.y) {
            result = true;
      }
    });
    return result;
  }

  my_move_to(my_target,my_cost_matrix) {
    
  }
}