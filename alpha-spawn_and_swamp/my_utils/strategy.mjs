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

import { local_containers_empty, local_containers_energy } from './map_utils.mjs';
import { enemy_majority_attack_parts } from './intel_utils.mjs';
import { adaptive_spawner } from './creep_utils.mjs'

import { mover_creep } from '../creep_classes/mover_creep.mjs';
import { constructor_creep } from '../creep_classes/constructor_creep.mjs';
import { defender_creep } from '../creep_classes/defender_creep.mjs';
import { healer_creep } from '../creep_classes/healer_creep.mjs';
import { raider_creep } from '../creep_classes/raider_creep.mjs';
import { minuteman_creep } from '../creep_classes/minuteman_creep.mjs';



import { arenaInfo } from '/game';


export class strategy {
  constructor() {
    this.map_side_multiplier = 1;
    this.spawn_priority = ["minuteman","mover","constructor","raider","healer","defender"];
    // this.spawn_priority = ["mover","constructor","raider","defender","healer"];
    this.spawn_limits = {minuteman:0,mover:2,constructor:1,raider:0,defender:100, healer:0};
    this.counts = {minuteman:0,mover:0,constructor:0,raider:0,defender:0,healer:0};

    // this.compositions = 
    //   {mover:[CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
    //   constructor:[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
    //   raider:[RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL],
    //   defender:[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE],
    //   healer:[HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE]};

    this.enemy_majority_weapons = "melee";

    this.compositions = 
      { minuteman:{WORK:0,MOVE:1,CARRY:0,ATTACK:0,RANGED_ATTACK:4,HEAL:1,TOUGH:0},
      mover:{WORK:0,MOVE:5,CARRY:1,ATTACK:0,RANGED_ATTACK:0,HEAL:0,TOUGH:0},
      constructor:{CARRY:3,WORK:1,MOVE:5,ATTACK:0,RANGED_ATTACK:0,HEAL:0,TOUGH:0},
      raider:{WORK:0,MOVE:10,CARRY:0,ATTACK:0,RANGED_ATTACK:1,HEAL:1,TOUGH:0},
      defender:{WORK:0,MOVE:5,CARRY:0,ATTACK:0,RANGED_ATTACK:1,HEAL:0,TOUGH:0},
      healer:{WORK:0,MOVE:1,CARRY:0,ATTACK:0,RANGED_ATTACK:0,HEAL:1,TOUGH:0}};

    this.max_creep_cost = 1000;
    this.max_movers = 7;

    // this.compositions = 
    //   {mover:[CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
    //   constructor:[MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
    //   raider:[RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL],
    //   defender:[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,MOVE],
    //   healer:[MOVE,HEAL,HEAL,MOVE]};


    this.creeps_list = [];

    this.local_containers_empty = false;
    this.local_container_energy = 0;

    //strategy specific variables
    this.local_energy_threshold = 1800; 

    this.rally_point = {x:0,y:0};
    this.rally_point_x_offset = 45; //positive is towards enemy side

    this.swarm_achieved = false;
    this.swarm_threshold = 15;
    this.engagement_range = 15;
    this.rush_time = 1500;

    this.incursion_threshold = 15; //distance from my side of map
    this.excursion_threshold = 15; //distance from opponent's side of map

    this.enemy_armed_excursion = false;
    this.enemy_armed_incursion = false;

    this.grid_center_local_range = 25;

  }

  update() {
    this.enemy_majority_weapons = enemy_majority_attack_parts();
    this.local_containers_empty = local_containers_empty();
    this.local_containers_energy = local_containers_energy();
    this.update_max_creep_cost();
    this.update_limits();
    this.update_compositions();
    this.spawn_to_priority();
    this.update_strategy_data();
  }

  update_max_creep_cost() {
    var extensions = utils.getObjectsByPrototype(StructureExtension).filter(i => i.my);
    
    if(getTicks() < 5) {
      this.max_creep_cost = 500;
    } else if(extensions.length >= 4) {
      this.max_creep_cost = extensions.length*100;
    } else {
      this.max_creep_cost = 1000;
    }
  }

  update_compositions() {
    if(this.enemy_majority_weapons == "melee") {
      this.compositions["defender"] = {WORK:0,MOVE:5,CARRY:0,ATTACK:0,RANGED_ATTACK:1,HEAL:0,TOUGH:0};
    } else {
      this.compositions["defender"] = {WORK:0,MOVE:4,CARRY:0,ATTACK:0,RANGED_ATTACK:3,HEAL:1,TOUGH:0};
    }
  }

  update_limits() {
    if(this.local_containers_energy < this.local_energy_threshold) {
      this.spawn_limits["mover"] = this.counts["defender"] < this.max_movers ? this.counts["defender"] : this.max_movers;
      this.spawn_limits["raider"] = 1;
    }

    // if(this.counts["constructor"] >= 1 && this.spawn_limits["mover"] < 2) {
    //   this.spawn_limits["mover"] = 2;
    // }

    if(this.enemy_armed_incursion) {
      this.spawn_limits["minuteman"] = 2;
    } else {
      this.spawn_limits["minuteman"] = 0;
    }
  }

  spawn_to_priority() {
    this.update_counts();
    this.spawn_limits["healer"] = Math.floor(this.counts["defender"]/3);

    let spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    for(let i = 0; i < this.spawn_priority.length; i++) {
      let creep_type = this.spawn_priority[i];
      if(this.counts[creep_type] < this.spawn_limits[creep_type]) {
        // console.log("Creep type: " + creep_type);
        // console.log("Count: " + this.counts[creep_type]);
        // console.log("Limit: " + this.spawn_limits[creep_type]);
        let creep_compsition = adaptive_spawner(this.compositions[creep_type],this.max_creep_cost);
        if(creep_type == "mover" && this.counts["mover"] <= 1) {
          creep_compsition = [CARRY,CARRY,MOVE,MOVE];
        }
        if(creep_type == "constructor" && getTicks() <= 150) {
          creep_compsition = [CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,WORK,WORK,CARRY];
        }
        var obj = spawn.spawnCreep(creep_compsition);
        if(!obj.error) {
          switch(creep_type) {
            case "mover":
              this.creeps_list.push(new mover_creep(obj.object));
              break;

            case "constructor":
              this.creeps_list.push(new constructor_creep(obj.object));
              break;

            case "raider":
              this.creeps_list.push(new raider_creep(obj.object));
              break;

            case "defender":
              this.creeps_list.push(new defender_creep(obj.object));
              break;

            case "healer":
              this.creeps_list.push(new healer_creep(obj.object));
              break;
            
            case "minuteman":
              this.creeps_list.push(new minuteman_creep(obj.object));
              break;

            default:

              break;
              
          }
        }
        break;
      }
    }
  }

  update_counts() {
    for(let c in this.counts) {
      this.counts[c] = 0;
    }

    for(let creep of this.creeps_list) {
      // console.log("Creep constructor name: " + creep.constructor.name);
      // console.log("Creep status: " + creep.get_status());
      if(creep.get_status() === "alive" || creep.get_status() === "spawning") {
        // console.log("Creep is alive");
        switch(creep.constructor.name) {
          case "mover_creep":
            // console.log("adding mover count");
            this.counts["mover"] += 1;
            break;

          case "constructor_creep":
            // console.log("adding defender count");  
            if(creep.state_machine_status && creep.state_machine_status != "enemy_pursuing") {
              this.counts["constructor"] += 1;
            }
            break;
            
          case "defender_creep":
            // console.log("adding defender count");  
            this.counts["defender"] += 1;
            break;
          
          case "healer_creep":
            // console.log("adding defender count");  
            this.counts["healer"] += 1;
            break;

          case "raider_creep":
            // console.log("adding defender count");  
            this.counts["raider"] += 1;
            break;

          case "minuteman_creep":
            this.counts["minuteman"] += 1;
            break;
          
          default:
            break;
        }
      }
    }

    this.update_swarm_achieved();
  }

  update_strategy_data() {
    this.update_rally_point();
    this.update_swarm_achieved();
    this.update_enemy_armed_excursion();
    this.update_enemy_armed_incursion();
  }

  update_rally_point() {
    if(this.local_containers_energy < this.local_energy_threshold) {
      this.rally_point_x_offset = 45;
    } else {
      this.rally_point_x_offset = 45;
    }

    let spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    this.map_side_multiplier = spawn.x < 50 ? 1:-1;
    this.rally_point = {x:this.rally_point_x_offset*this.map_side_multiplier,y:0};
  }

  update_swarm_achieved() {
    this.swarm_acheived = this.counts["defender"] >= this.swarm_threshold;
  }

  get_creeps_list() {
    return this.creeps_list;
  }

  update_enemy_armed_incursion() {
    
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
        if(spawn.x < 50 && e_armed_creep.x < this.incursion_threshold) {
            result = true;
        }
        if(spawn.x > 50 && e_armed_creep.x > 100-this.excursion_threshold) {
            result = true;
        }
    }
    // console.log("Enemy Excursion: " + result);
    this.enemy_armed_incursion = result;
  }

  update_enemy_armed_excursion() {
    
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
        if(spawn.x < 50 && e_armed_creep.x < 100-this.excursion_threshold) {
            result = true;
        }
        if(spawn.x > 50 && e_armed_creep.x > this.excursion_threshold) {
            result = true;
        }
    }
    this.enemy_armed_excursion = result;
  
  }

  creep_data() {
    return {var_swarm_achieved:this.swarm_achieved,
      var_engagement_range:this.engagement_range,
      var_enemy_armed_excursion:this.enemy_armed_excursion,
      var_enemy_armed_incursion:this.enemy_armed_incursion,
      var_rush_time:this.rush_time,
      var_rally_point:this.rally_point,
      var_grid_center_local_range:this.grid_center_local_range
    };
  }

  

}