import { general_creep } from './general_creep'

export default class defender_creep extends general_creep {
    constructor(creep_object) {
      creep_obj = creep_object
    }

    behavior() {
        var constructionSite = utils.getObjectsByPrototype(prototypes.ConstructionSite).find(i => i.my);
        var spawn = utils.getObjectsByPrototype(StructureSpawn).find(i => i.my);
        if(!constructionSite && rampartConstructionCount < rampart_locations.length) {
            utils.createConstructionSite(spawn.x+rampart_locations[rampartConstructionCount]["x"],spawn.y+rampart_locations[rampartConstructionCount]["y"], StructureRampart);
            rampartConstructionCount++;
        } else if(!constructionSite && towerConstructionCount < tower_locations.length) {
            utils.createConstructionSite(spawn.x+tower_locations[towerConstructionCount]["x"],spawn.y+tower_locations[towerConstructionCount]["y"], StructureTower);
            towerConstructionCount++;
        } else if(!constructionSite && extensionConstructionCount < extension_locations.length) {
            utils.createConstructionSite(spawn.x+extension_locations[extensionConstructionCount]["x"],spawn.y+extension_locations[extensionConstructionCount]["y"], StructureExtension);
            extensionConstructionCount++;
        } else if(!constructionSite && towerConstructionCount >= tower_locations.length && rampartConstructionCount >= rampart_locations.length && extensionConstructionCount >= extension_locations.length) {
            creep.request_energy = false;
            creep.role = "mover";
            constructor_limit = 0;
        } else {
            if(creep.build(constructionSite)==ERR_NOT_IN_RANGE) {
                creep.moveTo(constructionSite, {costMatrix: support_cost_matrix})
            } else {
                creep.request_energy = true;
            }
        }
    }

  }