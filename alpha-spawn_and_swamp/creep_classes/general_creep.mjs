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

import { enemy_armed_creeps, enemy_heal_creeps } from '../my_utils/map_utils.mjs';

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

  enemy_armed_creep_in_range(range) {
    let e_armed_creeps = enemy_armed_creeps();
    let result = false;
    for(let creep of e_armed_creeps) {
      if(getRange(this.creep_obj,creep) <= range) {
        result = true;
      }
    }
    return result;
  }

  get_move_part_count() {
    let body = this.creep_obj.body;
    let non_move_or_carry_parts_count = 0;
    let move_parts_count = 0;
    for(let part of body) {
      if(part["type"] == "move") {
        move_parts_count += 1;
      } else if (part["type"] != "carry") {
        non_move_or_carry_parts_count += 1;
      }
    }
    return move_parts_count;
  }

  get_non_carry_or_move_part_count() {
    let body = this.creep_obj.body;
    let non_move_or_carry_parts_count = 0;
    let move_parts_count = 0;
    for(let part of body) {
      if(part["type"] == "move") {
        move_parts_count += 1;
      } else if (part["type"] != "carry") {
        non_move_or_carry_parts_count += 1;
      }
    }
    return non_move_or_carry_parts_count;
  }

  get_work_part_count() {
    let body = this.creep_obj.body;
    let work_parts_count = 0;
    for(let part of body) {
      if(part["type"] == "work") {
        work_parts_count += 1;
      }
    }
    return work_parts_count;
  }

  ticks_to_reach(pos,opts) {
    let path = searchPath(this.creep_obj,pos,opts).path;
    let ticks = 0;
    let move_parts = this.get_move_part_count();
    let non_carry_or_move_parts = this.get_non_carry_or_move_part_count();
    
    for(let tile of path) {
      let tile_cost = 2;
      if(getTerrainAt(tile) == TERRAIN_SWAMP) {
        tile_cost = 10;
      }
      let fatigue_generated = tile_cost*non_carry_or_move_parts;
      let tile_ticks = Math.ceil(fatigue_generated/(move_parts*2));
      ticks += tile_ticks;
    }

    return ticks;
  }

  find_energy_within_ticks(ticks_on_station,min_amount) {
    let resources = utils.getObjectsByPrototype(Resource).filter(i => i.amount > min_amount);
    let containers = utils.getObjectsByPrototype(StructureContainer).filter(i => i.store[RESOURCE_ENERGY] > min_amount);

    let viable_energy = [];

    for(let r of resources) {
        let ticks_moving = this.ticks_to_reach(r, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
        let amount_upon_arrival = r.amount - ((ticks_on_station + ticks_moving)*2);
        if(amount_upon_arrival >= min_amount) {
            viable_energy.push(r);
        }
    }

    for(let c of containers) {
        let ticks_moving = this.ticks_to_reach(c, {costMatrix: this.support_cost_matrix, swampCost: this.swamp_cost});
        let sufficient_decay = true;
        if(c.ticksToDecay) {
            sufficient_decay = c.ticksToDecay > (ticks_moving + ticks_on_station);
        }
        if(sufficient_decay) {
            viable_energy.push(c);
        }
    }

    return this.creep_obj.findClosestByPath(viable_energy);
  }
}