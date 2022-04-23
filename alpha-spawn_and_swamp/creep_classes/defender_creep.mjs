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

import { general_creep } from './general_creep'

import { support_cost_matrix } from '../main.mjs';

export class defender_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.rush_time = 1300;
        this.swarm_acheived = false;
        this.enemy_excursion = false;
        this.enemy_incursion = false;
        this.rally_point = {x:50,y:50};
        this.range_to_target = 100;
    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        var closestEnemy = this.creep_obj.findClosestByPath(enemy_creeps);
        var closestEnemySpawn = this.creep_obj.findClosestByPath(enemy_spawns);
        var closestEnemyToSpawn = this.creep_obj.findClosestByPath(enemy_creeps);

        //closest wounded creep
        var creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        var myDamagedCreeps = creeps.filter(i => i.hits < i.hitsMax);
        var closestDamagedCreep = this.creep_obj.findClosestByPath(myDamagedCreeps);

        // console.log("!Swarm Achieved: " + !this.swarm_acheived);
        // console.log("Ticks: " + getTicks() + " Rush Time: " + this.rush_time);
        // console.log("!Enemy Armed Excursion: " + !this.enemy_armed_excursion);
        // console.log("No enemy within engagement range: " + (!closestEnemy || (closestEnemy && getRange(this.creep_obj,closestEnemy) > this.engagement_range)));
        // console.log("This Rally Point: " + (this.rally_point["x"]) + "," + (this.rally_point["y"]));
        // console.log("Rally Point Abs Coords: " + (spawn.x + this.rally_point["x"]) + "," + (spawn.y + this.rally_point["y"]));
        if (!this.swarm_acheived && getTicks() < this.rush_time && !this.enemy_armed_excursion && (!closestEnemy || (closestEnemy && getRange(this.creep_obj,closestEnemy) > this.engagement_range))) {
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"]);
            this.range_to_target = 100;
        } else if (closestEnemy && this.creep_obj.attack(closestEnemy) == ERR_NOT_IN_RANGE) {
            this.creep_obj.moveTo(closestEnemy);
            this.range_to_target = getRange(this.creep_obj,closestEnemy);
        } else if (!closestEnemy && closestEnemySpawn && this.creep_obj.attack(closestEnemySpawn) == ERR_NOT_IN_RANGE) {
            this.creep_obj.moveTo(closestEnemySpawn);
            this.range_to_target = getRange(this.creep_obj,closestEnemySpawn);
        } else  if (!closestEnemy && !closestEnemySpawn) {
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"]);
            this.range_to_target = 100;
        }

    }

    update_data(variables) {
        if("var_swarm_achieved" in variables) {this.swarm_acheived = variables["var_swarm_achieved"]};
        if("var_engagement_range" in variables) {this.engagement_range = variables["var_engagement_range"]};
        if("var_enemy_armed_excursion" in variables) {this.enemy_armed_excursion = variables["var_enemy_armed_excursion"]};
        if("var_enemy_armed_incursion" in variables) {this.enemy_armed_incursion = variables["var_enemy_armed_incursion"]};
        if("var_rush_time" in variables) {this.rush_time = variables["var_rush_time"]};
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
    }

  }