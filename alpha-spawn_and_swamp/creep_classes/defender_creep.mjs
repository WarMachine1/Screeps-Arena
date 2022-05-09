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

import { general_creep } from './general_creep';

import { support_cost_matrix } from '../main.mjs';

import { enemy_armed_creeps, enemy_heal_creeps } from '../my_utils/map_utils.mjs';

export class defender_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.rush_time = 1300;
        this.swarm_acheived = false;
        this.enemy_excursion = false;
        this.enemy_incursion = false;
        this.rally_point = {x:50,y:50};
        this.default_range_to_target = 500;
        this.range_to_target = this.default_range_to_target;
    }

    behavior() {
        let enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        let e_armed_creeps = enemy_armed_creeps();
        let e_heal_creeps = enemy_heal_creeps();
        let enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
        let spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        let closestEnemy = this.creep_obj.findClosestByRange(enemy_creeps);
        let closestEnemySpawn = this.creep_obj.findClosestByRange(enemy_spawns);

        // console.log("!Swarm Achieved: " + !this.swarm_acheived);
        // console.log("Ticks: " + getTicks() + " Rush Time: " + this.rush_time);
        // console.log("!Enemy Armed Excursion: " + !this.enemy_armed_excursion);
        // console.log("No enemy within engagement range: " + (!closestEnemy || (closestEnemy && getRange(this.creep_obj,closestEnemy) > this.engagement_range)));
        // console.log("This Rally Point: " + (this.rally_point["x"]) + "," + (this.rally_point["y"]));
        // console.log("Rally Point Abs Coords: " + (spawn.x + this.rally_point["x"]) + "," + (spawn.y + this.rally_point["y"]));
        if (!this.swarm_acheived && getTicks() < this.rush_time && !this.enemy_excursion && (!closestEnemy || (closestEnemy && getRange(this.creep_obj,closestEnemy) > this.engagement_range))) {
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"], {swampCost: 2});
            this.range_to_target = this.default_range_to_target;
        } else if (closestEnemy) { //attacking creep
            if(e_heal_creeps.length > 0) {
                let closest_heal_enemy = this.creep_obj.findClosestByRange(e_heal_creeps);
                if(getRange(this.creep_obj,closestEnemy) <= 2) {
                    let goals = [];
                    e_armed_creeps.forEach(enemy_armed_creep=> goals.push({ "pos": enemy_armed_creep, "range": 3 }));
                    let path = searchPath(this.creep_obj, goals, { flee: true, swampCost: 2 });
                    this.creep_obj.moveTo(path.path[0]);
                    if(this.creep_obj.rangedAttack(closest_heal_enemy) == ERR_NOT_IN_RANGE) {
                        this.creep_obj.rangedAttack(closestEnemy);
                    }
                } else if(this.creep_obj.rangedAttack(closest_heal_enemy) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(closest_heal_enemy, {swampCost: 2});
                    this.creep_obj.rangedAttack(closestEnemy);
                }
            } else {
                if(this.creep_obj.rangedAttack(closestEnemy) == ERR_NOT_IN_RANGE) {
                    this.creep_obj.moveTo(closestEnemy, {swampCost: 2});
                } else if(getRange(this.creep_obj,closestEnemy) <= 2) {
                    let goals = [];
                    e_armed_creeps.forEach(enemy_armed_creep=> goals.push({ "pos": enemy_armed_creep, "range": 3 }));
                    let path = searchPath(this.creep_obj, goals, { flee: true, swampCost: 2 });
                    this.creep_obj.moveTo(path.path[0]);
                }
            }
            this.range_to_target = getRange(this.creep_obj,closestEnemy);
        } else if (!closestEnemy && closestEnemySpawn && this.creep_obj.rangedAttack(closestEnemySpawn) == ERR_NOT_IN_RANGE) { //go for spawn
            this.creep_obj.moveTo(closestEnemySpawn, {swampCost: 2});
            this.range_to_target = getRange(this.creep_obj,closestEnemySpawn);
        } else  if (!closestEnemy && !closestEnemySpawn) {
            this.creep_obj.moveTo(spawn.x + this.rally_point["x"],spawn.y + this.rally_point["y"], {swampCost: 2});
            this.range_to_target = this.default_range_to_target;
        }

        if(this.creep_obj.body.some(bodyPart => bodyPart.type == HEAL)) {
            let creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
            let my_damaged_creeps = creeps.filter(i => i.hits < i.hitsMax);
            let closest_damaged_friendly = this.creep_obj.findClosestByRange(my_damaged_creeps, {costMatrix: this.support_cost_matrix});
            if(closest_damaged_friendly && getRange(this.creep_obj,closest_damaged_friendly) <= 1) {
                this.creep_obj.heal(closest_damaged_friendly);
            } else if (this.creep_obj.hits < this.creep_obj.hitsMax){
                this.creep_obj.heal(this.creep_obj);
            }
        }

    }
    
    update_data(variables) {
        if("var_swarm_achieved" in variables) {this.swarm_acheived = variables["var_swarm_achieved"]};
        if("var_engagement_range" in variables) {this.engagement_range = variables["var_engagement_range"]};
        if("var_enemy_armed_excursion" in variables) {this.enemy_excursion = variables["var_enemy_armed_excursion"]};
        if("var_enemy_armed_incursion" in variables) {this.enemy_incursion = variables["var_enemy_armed_incursion"]};
        if("var_rush_time" in variables) {this.rush_time = variables["var_rush_time"]};
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
    }

  }