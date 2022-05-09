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

import { enemy_armed_creeps, enemy_heal_creeps } from '../my_utils/map_utils.mjs';

export class raider_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.support_cost_matrix;
        this.rally_point = {x:50,y:50};

    }

    behavior() {
        var enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        var enemy_structures = utils.getObjectsByPrototype(Structure).filter(i => !i.my);
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);

        var enemy_eco_creeps = [];
        // var enemy_armed_creeps = [];

        for(var e_creep of enemy_creeps) {
            if(!e_creep.body.some(bodyPart => bodyPart.type == ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == RANGED_ATTACK) && !e_creep.body.some(bodyPart => bodyPart.type == HEAL)) {
                enemy_eco_creeps.push(e_creep);
            } else {
                // enemy_armed_creeps.push(e_creep);
            }
        }

        var closest_eco_enemy = this.creep_obj.findClosestByRange(enemy_eco_creeps, {costMatrix: this.support_cost_matrix, swampCost: 2});
        var closest_enemy = this.creep_obj.findClosestByRange(enemy_creeps);
        var closest_enemy_structure = this.creep_obj.findClosestByRange(enemy_structures, {costMatrix: this.support_cost_matrix, swampCost: 2});
        let e_armed_creeps = enemy_armed_creeps();
        let closest_armed_enemy = this.creep_obj.findClosestByRange(e_armed_creeps);
        
        if(closest_armed_enemy && getRange(this.creep_obj,closest_armed_enemy) <= 7) {
            let goals = [];
            e_armed_creeps.forEach(enemy_armed_creep=> goals.push({ "pos": enemy_armed_creep, "range": 8 }));
            let path = searchPath(this.creep_obj, goals, { costMatrix: this.support_cost_matrix, flee: true, swampCost: 2 });
            this.creep_obj.moveTo(path.path[0]);
            if(this.creep_obj.rangedAttack(closest_eco_enemy)== ERR_NOT_IN_RANGE) {
                this.creep_obj.rangedAttack(closest_enemy);
            }
        } else if (closest_eco_enemy) {
            if(this.creep_obj.rangedAttack(closest_eco_enemy)== ERR_NOT_IN_RANGE) {
                this.creep_obj.rangedAttack(closest_enemy);
            }
            this.creep_obj.moveTo(closest_eco_enemy, {costMatrix: this.support_cost_matrix, swampCost: 2});
        } else if (!closest_eco_enemy && closest_enemy_structure) {
            if(this.creep_obj.rangedAttack(closest_enemy_structure)== ERR_NOT_IN_RANGE) {
                this.creep_obj.rangedAttack(closest_enemy);
            }
            this.creep_obj.moveTo(closest_enemy_structure, {costMatrix: this.support_cost_matrix, swampCost: 2});
        } else  if (!closest_eco_enemy && !closest_enemy_structure) {
            this.creep_obj.moveTo(spawn.x+this.rally_point["x"],spawn.y+this.rally_point["y"], {costMatrix: this.support_cost_matrix, swampCost: 2});
        }
        
        if(this.creep_obj.body.some(bodyPart => bodyPart.type == HEAL)) {
            let creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
            let my_damaged_creeps = creeps.filter(i => i.hits < i.hitsMax);
            let closest_damaged_friendly = this.creep_obj.findClosestByRange(my_damaged_creeps, {costMatrix: this.support_cost_matrix});
            if(closest_damaged_friendly && getRange(this.creep_obj,closest_damaged_friendly) <= 3) {
                if(getRange(this.creep_obj,closest_damaged_friendly) <= 1) {
                    this.creep_obj.heal(closest_damaged_friendly);
                } else {
                    this.creep_obj.rangedHeal(closest_damaged_friendly);
                }
            } else {
                this.creep_obj.heal(this.creep_obj);
            }
        }
    }

    update_data(variables) {
        if("var_rally_point" in variables) {this.rally_point = variables["var_rally_point"]};
        if("var_support_cost_matrix" in variables) {this.support_cost_matrix = variables["var_support_cost_matrix"]};
    }
}