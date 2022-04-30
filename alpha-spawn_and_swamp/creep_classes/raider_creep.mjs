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

export class raider_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.support_cost_matrix;
        this.rally_point = {x:50,y:50};

    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
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

        var closestEcoEnemy = this.creep_obj.findClosestByRange(enemy_eco_creeps, {costMatrix: this.support_cost_matrix, swampCost: 2});
        var closestEnemy = this.creep_obj.findClosestByRange(enemy_creeps);
        var closestEnemySpawn = this.creep_obj.findClosestByRange(enemy_spawns, {costMatrix: this.support_cost_matrix, swampCost: 2});
        
        if (closestEcoEnemy) {
            if(this.creep_obj.rangedAttack(closestEcoEnemy)== ERR_NOT_IN_RANGE) {
                this.creep_obj.rangedAttack(closestEnemy);
            }
            this.creep_obj.moveTo(closestEcoEnemy, {costMatrix: this.support_cost_matrix, swampCost: 2});
        } else if (!closestEcoEnemy && closestEnemySpawn) {
            if(this.creep_obj.rangedAttack(closestEnemySpawn)== ERR_NOT_IN_RANGE) {
                this.creep_obj.rangedAttack(closestEnemy);
            }
            this.creep_obj.moveTo(closestEnemySpawn, {costMatrix: this.support_cost_matrix, swampCost: 2});
        } else  if (!closestEcoEnemy && !closestEnemySpawn) {
            this.creep_obj.moveTo(spawn.x+this.rally_point["x"],spawn.y+this.rally_point["y"], {costMatrix: this.support_cost_matrix, swampCost: 2});
        }
        this.creep_obj.heal(this.creep_obj);
    }

    update_data(variables) {
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
    }
}