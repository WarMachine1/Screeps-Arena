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


var constructionSite;

export function loop() {
    var creep = utils.getObjectsByPrototype(Creep).find(i => i.my);
    console.log("Creep body: " + JSON.stringify(creep.body));
    console.log("Creep ratio: " + get_body_to_move_ratio(creep));
    let path = searchPath(creep,{x:50,y:50});
    console.log("Path: " + JSON.stringify(path));
    console.log("Ticks: " + ticks_to_reach(creep,{x:50,y:50},{}));
    if(constructionSite) {
        console.log("Construction site structure: " + JSON.stringify(constructionSite.structure));
    }

    let cs_defined = false;
    if(constructionSite) {
        cs_defined = true;
        console.log("Construction site defined: " + cs_defined);
        console.log("Construction site exists: " + constructionSite.exists);
    }
    
    
    
        // for(let key in constructionSite) {
    //     console.log("Key: " + key + "  Value: " + constructionSite[key]);
    // }
    if(!creep.store[RESOURCE_ENERGY]) {
        var container = utils.findClosestByPath(creep, utils.getObjectsByPrototype(StructureContainer));
        console.log("Pickup result: " + creep.pickup(container));
        if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(container)
        }
        console.log("Container Energy: " + container.store[RESOURCE_ENERGY]);
    } else {
        if(!constructionSite) {
            constructionSite = utils.getObjectsByPrototype(ConstructionSite).find(i => i.my);
        }
        
        if(!constructionSite) {
            utils.createConstructionSite({x: 50, y: 55}, StructureExtension);
        } else {
            if(creep.build(constructionSite)==ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite)
            }
        }
    }
}

function get_body_to_move_ratio(creep) {
    let body = creep.body;
    let non_move_or_carry_parts_count = 0;
    let move_parts_count = 0;
    for(let part of body) {
      if(part["type"] == "move") {
        move_parts_count += 1;
      } else if (part["type"] != "carry") {
        non_move_or_carry_parts_count += 1;
      }
    }

    return non_move_or_carry_parts_count/move_parts_count;
}

function get_move_part_count(creep) {
    let body = creep.body;
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

  function get_non_carry_or_move_part_count(creep) {
    let body = creep.body;
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

function ticks_to_reach(creep,pos,opts) {
    let path = searchPath(creep,pos,opts).path;
    let ticks = 0;
    let move_parts = get_move_part_count(creep);
    let non_carry_or_move_parts = get_non_carry_or_move_part_count(creep);
    
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