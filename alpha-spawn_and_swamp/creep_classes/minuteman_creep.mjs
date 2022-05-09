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

import { enemy_armed_creeps, enemy_heal_creeps } from '../my_utils/map_utils.mjs';

export class minuteman_creep extends general_creep {
    constructor(creep_object) {
        super(creep_object);
        this.enemy_incursion = false;
    }

    behavior() {
        let target_rampart = this.get_nearest_available_rampart();
        this.creep_obj.moveTo(target_rampart);

        let creeps = utils.getObjectsByPrototype(Creep).filter(i => i.my);
        let enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        let e_armed_creeps = enemy_armed_creeps();
        let e_heal_creeps = enemy_heal_creeps();
        let enemy_spawns = utils.getObjectsByPrototype(StructureSpawn).filter(i => !i.my);
        let spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        let closest_enemy = this.creep_obj.findClosestByRange(enemy_creeps);       
        let closest_enemy_spawn = this.creep_obj.findClosestByRange(enemy_spawns);
        let closest_heal_enemy = this.creep_obj.findClosestByRange(e_heal_creeps);
        let my_damaged_creeps = creeps.filter(i => i.hits < i.hitsMax);
        let closest_damaged_friendly_creep = this.creep_obj.findClosestByRange(my_damaged_creeps);

        let my_damaged_structures = utils.getObjectsByPrototype(Structure).filter(i => i.hits < i.hitsMax);
        let closest_damaged_friendly_structure = this.creep_obj.findClosestByRange(my_damaged_structures);

        if(!closest_enemy && !closest_heal_enemy) {
            if(this.creep_obj.body.some(bodyPart => bodyPart.type == HEAL)) {
                if(closest_damaged_friendly_creep && this.creep_obj.heal(closest_damaged_friendly_creep) ==  ERR_NOT_IN_RANGE) {
                    this.creep_obj.rangedHeal(closest_damaged_friendly_creep);
                } else if(closest_damaged_friendly_structure && this.creep_obj.heal(closest_damaged_friendly_structure) ==  ERR_NOT_IN_RANGE) {
                    this.creep_obj.rangedHeal(closest_damaged_friendly_structure);
                }
            }
        } else if(this.mass_attack_needed()) {
            this.creep_obj.rangedMassAttack();
        } else if (getRange(this.creep_obj,closest_enemy) <= 3) {
            if(closest_heal_enemy && getRange(this.creep_obj,closest_heal_enemy) > 3) {
                this.creep_obj.rangedAttack(closest_heal_enemy);
            } else {
                this.creep_obj.rangedAttack(closest_enemy);
            }
        } else {
            if(this.creep_obj.body.some(bodyPart => bodyPart.type == HEAL)) {
                if(closest_damaged_friendly_creep && this.creep_obj.heal(closest_damaged_friendly_creep) ==  ERR_NOT_IN_RANGE) {
                    this.creep_obj.rangedHeal(closest_damaged_friendly_creep);
                } else if(closest_damaged_friendly_structure && this.creep_obj.heal(closest_damaged_friendly_structure) ==  ERR_NOT_IN_RANGE) {
                    this.creep_obj.rangedHeal(closest_damaged_friendly_structure);
                }
            }
        }
    }

    mass_attack_needed() {
        let enemy_creeps = utils.getObjectsByPrototype(Creep).filter(i => !i.my);
        let count = 0;
        for(let e_creep of enemy_creeps) {
            switch(getRange(this.creep_obj,e_creep)) {
                case 1:
                    count += 10;
                    break;
                
                case 2:
                    count += 4;
                    break;

                case 3:
                    count += 1;
                    break;

                default:
                    break;
            }
        }

        return count > 30;
    }

    get_nearest_available_rampart() {
        let my_ramparts = utils.getObjectsByPrototype(StructureRampart).filter(i => i.my);
        for( var i = 0; i < my_ramparts.length; i++){
            if ( this.check_occupied_by_creep(my_ramparts[i])) {
                my_ramparts.splice(i, 1);
                i--;
            }
        }
        let closest_rampart = this.creep_obj.findClosestByPath(my_ramparts);
        return closest_rampart;
    }

    check_occupied_by_creep(coords) {
        let result = false;
        let creeps = utils.getObjectsByPrototype(Creep);
        for(let c of creeps) {
            if(c.x == coords["x"] && c.y == coords["y"]) {
                result = true;
            }
        }
        return result;
    }

    update_data(variables) {
        if("var_enemy_armed_incursion" in variables) {this.enemy_incursion = variables["var_enemy_armed_incursion"]};
    }
}