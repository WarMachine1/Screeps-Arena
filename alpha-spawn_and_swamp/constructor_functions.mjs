import { constructors } from './main';

export function nearest_constructor_requesting(creep) {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy;
    });
    return creep.findClosestByPath(requesting_constructors);
}
export function constructor_requesting() {
    var requesting_constructors = constructors.filter(function (constructor) {
        return constructor.request_energy;
    });
    return requesting_constructors.length > 0;
}
