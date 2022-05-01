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


export class logger {
  constructor() {
    this.total_energy_spent = 0;
    this.previous_energy_in_storage = 0;


    this.spawn_health_threshold = 300;
    this.wrote_file = false;
  }

  update() {
    this.update_total_energy();

    if(this.spawns_almost_dead() && !this.wrote_file) {
      this.write_after_action_report();
    }

  }

  write_after_action_report() {
    console.log("--------------AFTER ACTION REPORT-----------------")
    console.log("Total energy spent: " + this.total_energy_spent);
    this.wrote_file = true;
  }

  update_total_energy() {
    let my_spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    let my_extensions = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my);
    let stored_energy = my_spawn.store.getUsedCapacity(RESOURCE_ENERGY);
    for(let e of my_extensions) {
      stored_energy += e.store.getUsedCapacity(RESOURCE_ENERGY);
    }

    let delta_stored_energy = stored_energy-this.previous_energy_in_storage;
    if(delta_stored_energy < 0) {
      this.total_energy_spent -= delta_stored_energy;
      //console.log("Total energy spent: " + this.total_energy_spent);
    }
    this.previous_energy_in_storage = stored_energy;
  }

  spawns_almost_dead() {
    let result = false;
    let spawns = utils.getObjectsByPrototype(prototypes.StructureSpawn);
    for(let s of spawns) {
      if(s.hits <= this.spawn_health_threshold) {
        result = true;
      }
    }
    return result;
  }

}