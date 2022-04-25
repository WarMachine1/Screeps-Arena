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

import { mover_creep } from '../creep_classes/mover_creep.mjs';
import { constructor_creep } from '../creep_classes/constructor_creep.mjs';
import { defender_creep } from '../creep_classes/defender_creep.mjs';
import { healer_creep } from '../creep_classes/healer_creep.mjs';



import { arenaInfo } from '/game';


export class strategy {
  constructor() {
    this.map_side_multiplier = 1;
    this.spawn_priority = ["constructor","mover","healer","defender"];
    // this.spawn_priority = ["mover","constructor","raider","defender","healer"];
    this.spawn_limits = {mover:5,constructor:0,defender:100, healer:0};
    // this.spawn_limits = {mover:5,constructor:1,raider:1,defender:100,healer:1};
    // this.counts = {mover:0,constructor:0,defender:0, healer: 0};
    this.counts = {mover:0,constructor:0,raider:0,defender:0,healer:0};

    // this.compositions = 
    //   {mover:[CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
    //   constructor:[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
    //   raider:[RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOV E,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL],
    //   defender:[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,MOVE],
    //   healer:[HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE]};

    this.compositions = 
      {mover:[CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
      constructor:[MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE],
      raider:[RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL],
      defender:[TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,MOVE],
      healer:[MOVE,HEAL,HEAL,MOVE]};


    this.creeps_list = [];

    this.local_containers_empty = false;
    this.local_container_energy = 0;

    //strategy specific variables
    

    this.rally_point = {x:0,y:0};
    this.rally_point_x_offset = 5; //positive is towards enemy side

    this.swarm_achieved = false;
    this.swarm_threshold = 15;
    this.engagement_range = 15;
    this.rush_time = 1300;

    this.incursion_threshold = 15; //distance from my side of map
    this.excursion_threshold = 15; //distance from opponent's side of map

    this.enemy_armed_excursion = false;
    this.enemy_armed_incursion = false;

  }

  update() {
    this.local_containers_empty = local_containers_empty();
    this.local_containers_energy = local_containers_energy();
    this.update_limits();
    this.spawn_to_priority();
    this.update_strategy_data();
  }

  update_limits() {
    console.log("Local containers energy: " + this.local_containers_energy);
    if(this.local_containers_energy < 1000) {
      this.spawn_limits["mover"] = 15;
      this.spawn_limits["constructor"] = 1;
    }
  }

  spawn_to_priority() {
    this.update_counts();
    this.spawn_limits["healer"] = Math.floor(this.counts["defender"]/3);
    // console.log("Healer Limit: " + this.spawn_limits["healer"]);

    let spawn = utils.getObjectsByPrototype(prototypes.StructureSpawn).find(i => i.my);
    for(let i = 0; i < this.spawn_priority.length; i++) {
      let creep_type = this.spawn_priority[i];
      // console.log("Creep Type: " + creep_type);
      // console.log("Count: " + this.counts[creep_type]);
      // console.log("Limit: " + this.spawn_limits[creep_type]);
      // console.log("Counts: " + JSON.stringify(this.counts));
      // console.log("Count: " + this.counts[creep_type]);
      // console.log("Limit: " + this.spawn_limits[creep_type]);
      if(this.counts[creep_type] < this.spawn_limits[creep_type]) {
        // console.log("Limit not reached yet for Creep Type: " + creep_type);
        var obj = spawn.spawnCreep(this.compositions[creep_type]);
        if(!obj.error) {
          switch(creep_type) {
            case "mover":
              this.creeps_list.push(new mover_creep(obj.object));
              break;

            case "constructor":
              this.creeps_list.push(new constructor_creep(obj.object));
              break;

            case "raider":

              break;

            case "defender":
              this.creeps_list.push(new defender_creep(obj.object));
              break;

            case "healer":
              this.creeps_list.push(new healer_creep(obj.object));
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
    this.counts = {mover:0,constructor:0,raider:0,defender:0,healer:0};

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
            this.counts["constructor"] += 1;
            break;
            
          case "defender_creep":
            // console.log("adding defender count");  
            this.counts["defender"] += 1;
            break;
          
          case "healer_creep":
          // console.log("adding defender count");  
          this.counts["healer"] += 1;
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
    if(this.local_containers_energy < 1000) {
      this.rally_point_x_offset = 30;
    } else {
      this.rally_point_x_offset = 5;
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
      var_rally_point:this.rally_point};
  }

}